"""
app/services/currency_service.py
ExchangeRate API integration with retry mechanism, timeout handling, and fallback.
Converts INR amounts to USD using live exchange rates.
Falls back to a configurable static rate if the external API is unavailable.
"""
import logging
from typing import Tuple

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import settings

logger = logging.getLogger(__name__)

EXCHANGE_API_URL = "https://v6.exchangerate-api.com/v6/{key}/latest/{base}"


@retry(
    retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=5),
    reraise=False,
)
async def _fetch_rate(base_currency: str) -> dict:
    """Fetch exchange rates with retry logic (max 3 attempts, exponential backoff)."""
    url = EXCHANGE_API_URL.format(
        key=settings.EXCHANGE_RATE_API_KEY, base=base_currency
    )
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = client.get(url)  # type: ignore
        response.raise_for_status()
        return response.json()


async def convert_to_usd(amount: float, from_currency: str = "INR") -> Tuple[float, bool]:
    """
    Convert an amount to USD.

    Returns:
        (usd_amount: float, used_fallback: bool)
        - used_fallback=True means the live API failed and we used a static rate.
    """
    if not settings.EXCHANGE_RATE_API_KEY:
        logger.warning("No EXCHANGE_RATE_API_KEY set, using fallback rate")
        return _apply_fallback(amount, from_currency), True

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            url = EXCHANGE_API_URL.format(
                key=settings.EXCHANGE_RATE_API_KEY, base=from_currency
            )
            # Retry up to 3 times
            for attempt in range(3):
                try:
                    response = await client.get(url)
                    response.raise_for_status()
                    data = response.json()

                    if data.get("result") != "success":
                        raise ValueError(f"API error: {data.get('error-type')}")

                    rate = data["conversion_rates"].get("USD")
                    if not rate:
                        raise ValueError("USD rate not found in response")

                    usd_amount = round(amount * rate, 2)
                    logger.info(
                        f"Converted {amount} {from_currency} → {usd_amount} USD "
                        f"(rate: {rate})"
                    )
                    return usd_amount, False

                except (httpx.RequestError, httpx.TimeoutException) as e:
                    if attempt < 2:
                        logger.warning(f"Currency API attempt {attempt+1} failed: {e}, retrying...")
                        import asyncio
                        await asyncio.sleep(1 * (attempt + 1))
                    else:
                        raise

    except Exception as e:
        logger.error(f"Currency conversion failed after retries: {e}")
        fallback = _apply_fallback(amount, from_currency)
        logger.warning(f"Using fallback rate: {amount} {from_currency} → {fallback} USD")
        return fallback, True


def _apply_fallback(amount: float, from_currency: str) -> float:
    """Apply a static fallback conversion rate."""
    # Default: 1 USD = 83 INR
    if from_currency.upper() == "INR":
        return round(amount / settings.EXCHANGE_RATE_FALLBACK_USD, 2)
    # For other currencies, return the original amount
    return round(amount, 2)
