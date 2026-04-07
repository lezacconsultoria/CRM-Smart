const { spawn } = require('child_process');

const proc = spawn('npx', [
  '-y',
  'mcp-remote',
  'https://nocodb.lezacconsultoria.com/mcp/ncbtcb5g1nadf74w',
  '--header',
  'xc-mcp-token: CkLzwXmG1FajXPXVowQPP4vG_PRkk8HQ'
]);

proc.stdin.write(JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test", version: "1.0.0" }
  }
}) + '\n');

proc.stdin.write(JSON.stringify({
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list"
}) + '\n');

proc.stdout.on('data', data => {
  console.log('STDOUT:', data.toString());
  if (data.toString().includes('tools/list')) {
      proc.kill();
  }
});

proc.stderr.on('data', data => {
  console.error('STDERR:', data.toString());
});

setTimeout(() => proc.kill(), 10000);
