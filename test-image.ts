import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/gemini/generateImage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "A cute cat",
    })
  });
  const text = await res.text();
  console.log(res.status, text);
}
test();
