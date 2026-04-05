This Project is used to create infrastructure on AWS platform using terraform.  

The terraform files be generated automatically by prompting requirements using natural language.  

I am using llm model: "gemini-2.5-flash"  

U need to create backend/.env file as follow:  

GEMINI_API_KEY=your_api_key  
DB_PASSWORD=db_password  
DB_USER=db_username  
DB_HOST=db_hostname  
DB_NAME="ai_devops"  
PORT=5001
