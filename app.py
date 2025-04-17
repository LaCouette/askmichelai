import os
import shutil
import uuid
import traceback
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from agent import ShopifyAgent
from knowledge_base_manager import KnowledgeBaseManager
from image_analyzer import ImageAnalyzer
import json
import re

# Initialize FastAPI app
app = FastAPI(title="Shopify Section Creator")

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Initialize Shopify agent, knowledge base manager, and image analyzer
shopify_agent = ShopifyAgent()
kb_manager = KnowledgeBaseManager()
image_analyzer = ImageAnalyzer()

# Add session management (simple in-memory dictionary)
agent_sessions = {}

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Render the chat interface."""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/delivery", response_class=HTMLResponse)
async def delivery_page(request: Request):
    """Render the code delivery page."""
    return templates.TemplateResponse("delivery.html", {"request": request})

@app.post("/api/chat")
async def chat(
    session_id: str = Form(...),
    message: str = Form(...),
    image: UploadFile = File(None),
    answers: str = Form(None) # Nouveau champ pour les réponses aux questions (JSON string)
):
    """Process a chat message with optional image upload or answers to questions."""
    image_path = None
    full_query = message
    
    # Get agent instance for this session (simple dictionary-based session management)
    if session_id not in agent_sessions:
        agent_sessions[session_id] = ShopifyAgent()
    agent = agent_sessions[session_id]

    try:
        # Initialize embeddings and vector store explicitly for lazy loading
        agent.kb_manager.init_embeddings()
        agent.kb_manager.build_vector_store()
        
        # Handle answers if provided
        if answers:
            try:
                answered_questions = json.loads(answers)
                # Format answers clearly for the agent
                answer_text = "\n\n[RÉPONSES AUX QUESTIONS PRÉCÉDENTES]\n"
                for i, ans in enumerate(answered_questions):
                    answer_text += f"{i+1}. {ans}\n"
                full_query = answer_text # Use answers as the primary input for this turn
            except json.JSONDecodeError:
                print("Error decoding answers JSON")
                # Handle error or proceed without answers
                pass # Fallback to just using the message if answers are malformed
            except Exception as e:
                print(f"Error processing answers: {e}")
                pass

        # Save uploaded image if provided (only on initial query, not when answering)
        if image and image.filename and not answers:
            try:
                # Generate unique filename
                file_extension = os.path.splitext(image.filename)[1]
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                image_path = os.path.join("uploads", unique_filename)
                
                # Save the file
                with open(image_path, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
            except Exception as img_err:
                print(f"Error saving image: {img_err}")
                image_path = None
        
        # Process the query with our agent
        # Pass the full query (initial message or formatted answers)
        raw_response = agent.process_query(full_query, image_path if not answers else None)
        
        # Check response type (questions or code)
        if raw_response.strip().startswith("[QUESTIONS]"):
            # Extract questions
            questions_text = raw_response.strip().replace("[QUESTIONS]", "").strip()
            questions_list = [q.strip() for q in questions_text.split('\n') if q.strip()]
            # Remove numbering like "1." or "1)"
            cleaned_questions = []
            for q in questions_list:
                match = re.match(r"^\d+[\.\)]\s*(.*)", q)
                if match:
                    cleaned_questions.append(match.group(1).strip())
                else:
                    cleaned_questions.append(q.strip())
            
            response_data = {"type": "questions", "content": cleaned_questions}
        else:
            # Assume it's code
            response_data = {"type": "code", "content": raw_response}
        
        return JSONResponse(content=response_data)
        
    except Exception as e:
        # Get full error details including traceback
        error_details = traceback.format_exc()
        print(f"Error processing query: {e}")
        print(f"Traceback: {error_details}")
        
        # Return a user-friendly error message
        error_message = "Je suis désolé, j'ai rencontré une erreur." # Keep it simple
        return JSONResponse(
            content={"type": "error", "content": error_message},
            status_code=500
        )

@app.post("/api/reset")
async def reset_conversation(session_id: str = Form(None)):
    """Reset the conversation history."""
    # Si session_id est None, retourner simplement un message de succès
    if not session_id:
        return {"message": "No session specified, nothing to reset"}
        
    if session_id in agent_sessions:
        try:
            agent_sessions[session_id].reset_conversation()
            print(f"Agent state for session {session_id} reset.")
            return {"message": "Conversation reset successfully"}
        except Exception as e:
            print(f"Error resetting agent state for session {session_id}: {e}")
            # Fallback or specific error handling
            return JSONResponse(
                content={"message": "Error resetting conversation state"},
                status_code=500 
            )
    else:
        return {"message": "Session not found or already reset"}

if __name__ == "__main__":
    # Build knowledge base on startup
    kb_manager.build_vector_store()
    # Run the API server
    uvicorn.run("app:app", host="127.0.0.1", port=8080, reload=True)