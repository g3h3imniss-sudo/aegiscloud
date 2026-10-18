const worker = {
  async queue(batch, env) {
    for (const message of batch.messages) {
      const response = await fetch(`${env.APP_URL}/api/rdr/events`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-rdr-event-token": env.RDR_EVENT_TOKEN,
        },
        body: JSON.stringify({ id: message.id, event: message.body }),
      });

      if (!response.ok) {
        throw new Error(`AegisCloud event receiver returned HTTP ${response.status}`);
      }
      message.ack();
    }
  },
};

export default worker;
