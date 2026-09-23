import { useEffect, useState } from "react";

import { subscribeToTable } from "../services/reportRealtime";

function RealtimeTest() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToTable("proposals", (payload) => {
      console.log("Realtime event:", payload);

      setEvents((current) => [
        {
          id: crypto.randomUUID(),
          event: payload.eventType,
          record: payload.new ?? payload.old ?? {},
          receivedAt: new Date().toLocaleTimeString("id-ID"),
        },
        ...current,
      ]);
    });

    return unsubscribe;
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h1>Realtime Test</h1>

        <p>
          Halaman ini mendengarkan perubahan pada tabel
          <strong> proposals</strong>.
        </p>

        {events.length === 0 ? (
          <p>Menunggu event Realtime...</p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <strong>{event.event}</strong>

                <div
                  style={{
                    marginTop: "6px",
                    color: "#64748b",
                  }}
                >
                  {event.receivedAt}
                </div>

                <pre
                  style={{
                    marginTop: "12px",
                    overflowX: "auto",
                    fontSize: "12px",
                  }}
                >
                  {JSON.stringify(event.record, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default RealtimeTest;
