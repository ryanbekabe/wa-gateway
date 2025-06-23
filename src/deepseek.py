# Please install OpenAI SDK first: `pip3 install openai`
# curl -X POST http://localhost:11434/api/generate -H "Content-Type: application/json" -d "{\"model\": \"llama3.2\", \"prompt\": \"Apa itu zakat maal?\", \"stream\": false}"
# curl https://api.deepseek.com/chat/completions -H "Content-Type: application/json" -H "Authorization: Bearer sk-ae8afb81d07f4ac58dc8c2b08254d154" -d '{ "model": "deepseek-chat", "messages": [{"role": "system", "content": "You are a helpful assistant."},{"role": "user", "content": "Hello!"}],"stream": false }'
# curl -X POST https://api.deepseek.com/chat/completions -H "Content-Type: application/json" -H "Authorization: Bearer <sk-ae8afb81d07f4ac58dc8c2b08254d154>" -d "{\"model\": \"deepseek-chat\", \"messages\": [{\"role\": \"system\", \"content\": \"You are a helpful assistant.\"}, {\"role\": \"user\", \"content\": \"Hello!\"}], \"stream\": false}"
from openai import OpenAI

""" client = OpenAI(api_key="sk-ae8afb81d07f4ac58dc8c2b08254d154", base_url="https://api.deepseek.com")

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello"},
    ],
    stream=False
)

print(response.choices[0].message.content) """

from openai import OpenAI

client = OpenAI(
    api_key="sk-ae8afb81d07f4ac58dc8c2b08254d154",
    base_url="https://api.deepseek.com"
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"},
    ],
    stream=False
)

print(response.choices[0].message.content)