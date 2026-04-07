async function connectAndCreateTables() {
  const token = 'CkLzwXmG1FajXPXVowQPP4vG_PRkk8HQ';
  const sseUrl = 'https://nocodb.lezacconsultoria.com/mcp/ncbtcb5g1nadf74w/sse';
  
  console.log('Connecting to SSE:', sseUrl);
  
  const headers = { 'xc-mcp-token': token };
  
  try {
    const sseResponse = await fetch(sseUrl, { headers });
    if (!sseResponse.ok) {
      console.error('Failed to connect to SSE:', await sseResponse.text());
      return;
    }

    const reader = sseResponse.body.getReader();
    const decoder = new TextDecoder();
    
    let postEndpoint = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      console.log('Received chunk:', chunk);
      
      if (chunk.includes('event: endpoint')) {
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            postEndpoint = line.replace('data: ', '').trim();
            // Resolve relative URLs
            if (!postEndpoint.startsWith('http')) {
              const base = new URL(sseUrl);
              postEndpoint = new URL(postEndpoint, base.origin).toString();
            }
            console.log('Got POST endpoint:', postEndpoint);
            break;
          }
        }
      }

      if (postEndpoint) {
        break;
      }
    }

    if (!postEndpoint) {
      console.error('Did not receive POST endpoint from SSE');
      return;
    }

    // Now send the JSON-RPC request to list tools
    const listToolsReq = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    console.log('Sending tools/list to', postEndpoint);
    const postRes = await fetch(postEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xc-mcp-token': token
      },
      body: JSON.stringify(listToolsReq)
    });

    console.log('Tools/list response:', await postRes.text());
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
  }
}

connectAndCreateTables();
