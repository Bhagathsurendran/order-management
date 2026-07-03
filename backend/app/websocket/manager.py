"""
app/websocket/manager.py
WebSocket Connection Manager.
Maintains a registry of active WebSocket connections and provides
broadcast(), connect(), and disconnect() methods.
All order status changes are broadcast to every connected client.
"""
import json
import logging
from typing import Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time order status updates."""

    def __init__(self) -> None:
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection and register it."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(
            f"WebSocket connected. Total connections: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket from the active registry."""
        self.active_connections.discard(websocket)
        logger.info(
            f"WebSocket disconnected. Total connections: {len(self.active_connections)}"
        )

    async def broadcast(self, payload: dict) -> None:
        """
        Broadcast a JSON message to all active connections.
        Automatically removes dead connections on send failure.
        """
        dead_connections: Set[WebSocket] = set()
        message = json.dumps(payload)

        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket, removing: {e}")
                dead_connections.add(connection)

        # Clean up dead connections
        self.active_connections -= dead_connections

    async def send_personal_message(
        self, message: dict, websocket: WebSocket
    ) -> None:
        """Send a JSON message to a single client."""
        await websocket.send_text(json.dumps(message))

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# Singleton instance used across the entire application
ws_manager = ConnectionManager()
