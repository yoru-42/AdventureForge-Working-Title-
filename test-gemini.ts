import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/gemini/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-3.8-flash',
      contents: "Hello World",
      config: {}
    })
  });
  const text = await res.text();
  console.log(res.status, text);
}
test();
