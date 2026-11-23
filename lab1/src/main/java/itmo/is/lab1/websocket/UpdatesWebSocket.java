package itmo.is.lab1.websocket;

import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/ws/updates")
public class UpdatesWebSocket {
    private static final Set<Session> SESSIONS = ConcurrentHashMap.newKeySet();

    @OnOpen
    public void onOpen(Session session) {
        SESSIONS.add(session);
    }

    @OnClose
    public void onClose(Session session) {
        SESSIONS.remove(session);
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        SESSIONS.remove(session);
    }

    public static void broadcast(String entityType) {
        for (Session session : SESSIONS) {
            if (session.isOpen()) {
                try {
                    session.getAsyncRemote().sendText(entityType);
                } catch (Exception e) {
                    SESSIONS.remove(session);
                }
            } else {
                SESSIONS.remove(session);
            }
        }
    }
}