from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = ""
    groq_api_key: str = ""
    github_token: str = ""
    hf_token: str = ""
    jina_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    groq_model: str = "openai/gpt-oss-120b"
    groq_stt_model: str = "whisper-large-v3-turbo"
    database_url: str = "sqlite:///./interviewpro.db"
    frontend_origin: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
