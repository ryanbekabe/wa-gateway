// Modul helper untuk request ke Ollama
// Tidak perlu import fetch, gunakan global fetch bawaan Node.js v18+

export async function askOllama(prompt: string): Promise<string> {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama3.2', prompt })
  });
  if (!response.ok) throw new Error('Ollama API error');
  // Ollama streaming, ambil hanya jawaban pertama (atau bisa diubah sesuai kebutuhan)
  const reader = response.body?.getReader();
  let result = '';
  if (reader) {
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = Buffer.from(value).toString('utf8');
        // Ollama streaming JSON per baris
        for (const line of chunk.split('\n')) {
          if (line.trim()) {
            try {
              const obj = JSON.parse(line);
              if (obj.response) result += obj.response;
            } catch {}
          }
        }
      }
    }
  }
  return result.trim() || '[Ollama tidak merespon]';
}
