# imports
from datetime import datetime
import os
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import Annotated, Sequence, TypedDict, Literal
from langchain_core.messages import BaseMessage, ToolMessage
from langgraph.graph.message import add_messages
from dotenv import load_dotenv
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from datetime import datetime, time, timezone
import certifi
from pymongo import MongoClient

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")


# add the state
class State(TypedDict):
    """The state of the agent"""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    next: Literal["end", "tool"] | None


################################
# FUNCTION (TOOL) DECLARATIONS #
################################

# Initialize synchronous PyMongo client for the LangChain tool
# MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
# sync_client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
# db = sync_client["receiptdb"]
# receipts_collection = db["receipts"]


class DBDateInput(BaseModel):
    start_date: str = Field(
        default="1970-01-01",
        description="The lower bound of the database search in YYYY-MM-DD format",
    )
    end_date: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        description="The upper bound of the database search in YYYY-MM-DD format",
    )


# @tool(args_schema=DBDateInput)
# def get_receipts_between_dates(start_date: str, end_date: str) -> list[dict] | str:
#     """
#     Returns a list of receipt records from MongoDB between start_date and end_date (inclusive).
#     Dates must be formatted as YYYY-MM-DD.
#     """
#     try:
#         # 1. Parse YYYY-MM-DD strings into inclusive UTC datetime bounds
#         start_dt = datetime.combine(
#             datetime.strptime(start_date, "%Y-%m-%d").date(),
#             time.min,  # 00:00:00
#             tzinfo=timezone.utc,
#         )
#         end_dt = datetime.combine(
#             datetime.strptime(end_date, "%Y-%m-%d").date(),
#             time.max,  # 23:59:59.999999 (makes end_date truly inclusive)
#             tzinfo=timezone.utc,
#         )
#     except ValueError:
#         return "Invalid date format. Please provide start_date and end_date as YYYY-MM-DD."
#
#     if start_dt > end_dt:
#         return "Error: start_date cannot be after end_date."
#
#     # 2. Query MongoDB (replace "date" with your actual timestamp field name, e.g., "created_at")
#     query = {
#         "date": {
#             "$gte": start_dt,
#             "$lte": end_dt,
#         }
#     }
#
#     cursor = receipts_collection.find(query).sort("date", 1)
#
#     # 3. Convert MongoDB BSON types (ObjectId, datetime) into JSON-safe strings for the LLM
#     results: list[dict] = []
#     for doc in cursor:
#         doc["_id"] = str(doc["_id"])
#         for key, value in doc.items():
#             if isinstance(value, datetime):
#                 doc[key] = value.isoformat()
#         results.append(doc)
#
#     return results




# toolkit
toolkit = []
tool_map = {
    # "get_receipts_between_dates": get_receipts_between_dates,
    # "general_search_wikipedia": general_search_wikipedia,
    # "birth_death_dates_wikipedia": birth_death_dates_wikipedia
}

# instantiate the LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    google_api_key=api_key
)

model = llm.bind_tools(toolkit)


# construct the nodes/functions
def call_tools(state: State):
    # get the tool call
    # print("Called tool")
    # print(state)
    last_message = state["messages"][-1]
    outputs = []
    # loop through the tool calls
    for tool_call in last_message.tool_calls:
        # execute the tool
        # ADD TOOL ERROR HANDLING HERE
        try:
            tool_result = tool_map[tool_call["name"]].invoke(tool_call["args"])
        except Exception as e:
            print("WTF ERROR BRO HONESTLY SO CONFUSED RN", str(e))
            tool_result = {"error": str(e)}
        # append result to messages
        outputs.append(
            ToolMessage(
                content=tool_result,
                name=tool_call["name"],
                tool_call_id=tool_call["id"]
            )
        )
        print(f"TOOL CALLED! (Possible errors):\n{outputs[-1]}")

    return {"messages": outputs}


def call_llm(state: State):
    # call the model with the current message history
    response = model.invoke(state["messages"])
    print(f"LLM:\n{response}")
    # return the response
    return {"messages": [response]}


def router(state: State):
    last_message = state["messages"][-1]
    # If the last message is not a tool call, then finish
    print("ROUTER DETERMINING...")
    if not last_message.tool_calls:  # or last_message.tool_calls[0].content.get("error") is not None:
        return {"next": "end"}
    # default to continue
    return {"next": "tool"}


# construct the graph
graph_builder = StateGraph(State)

# add nodes to the graph
graph_builder.add_node("llm", call_llm)
graph_builder.add_node("tool_call", call_tools)
graph_builder.add_node("router", router)

# add edges to the graph
graph_builder.add_edge(START, "llm")
graph_builder.add_edge("llm", "router")
graph_builder.add_conditional_edges(
    "router",
    lambda state: state.get("next"),
    path_map={"end": END, "tool": "tool_call"}
)
graph_builder.add_edge("tool_call", "llm")

graph = graph_builder.compile()

state = {"messages": [], "next": None}

query = "Hello what is your name?"
state["messages"] = [("user", query + ". DO NOT USE ANY TOOLS.")]

response = graph.invoke(state)
print(response)

def zero_shot_query(query: str):
    state = {"messages": [], "next": None}
    state["messages"] = [("user", query + ". DO NOT USE ANY TOOLS.")]
    response = graph.invoke(state)
    return response.content[0]["text"]

# from IPython.display import Image, display
#
# try:
#     display(Image(graph.get_graph().draw_mermaid_png(output_file_path="Simple graph.png")))
# except Exception as e:
#     print(e)
