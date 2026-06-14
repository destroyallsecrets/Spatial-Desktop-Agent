import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

// Create the shared Gemini client utility following the SDK skill guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const PORT = 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

// The AI's conversational chat session context
let chatSession: any = null;

// Helper to crawl, query, or summarize websites using Gemini's integrated Search Grounding
async function fetchCyberNetProxy(urlOrQuery: string): Promise<any> {
  const query = urlOrQuery.trim();
  if (!query) return null;

  const systemPrompt = `
You are the CyberNet Web Proxy. You parse search queries or website URLs and generate a simulated cyberpunk, highly detailed, navigable web page layout in structured JSON format.
If the input is a search query, provide realistic, live-relevant search results using standard search snippets (use the integrated googleSearch tool to get authentic, real-time results).
If the input is a URL, crawl/generate the website's main headers, detailed structured paragraphs, and nested internal links so the user can browse them in our CyberNet browser.
Be extremely detailed, interesting, and real (no placeholders or lorem ipsum). Make it look like a highly functional, immersive web terminal. Do not return markdown, output exactly valid JSON matching the schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Fetch, search, or summarize content for coordinate/query: ${query}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING },
            type: { type: Type.STRING, description: "Must be either 'article' or 'search'" },
            summary: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["heading", "content"]
              }
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["text", "url"]
              }
            },
            searchResults: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  snippet: { type: Type.STRING }
                },
                required: ["title", "url", "snippet"]
              }
            }
          },
          required: ["title", "url", "type", "summary"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("fetchCyberNetProxy exception:", error);
    return {
      title: "Index Refused - Decryption Error",
      url: query.startsWith("http") ? query : `https://cybernet.node/search?q=${encodeURIComponent(query)}`,
      type: "article",
      summary: "Proxy server failed to handshake with remote terminal. Protocol timed out.",
      sections: [
        {
          heading: "Routing Error",
          content: `Unable to access "${query}". Detailed debug log: ${error.message || "Unknown socket exception. Security headers restriction."}`
        }
      ],
      links: [
        { text: "Main Index", url: "https://en.wikipedia.org/wiki/Main_Page" }
      ],
      searchResults: []
    };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Endpoint for manual browser loads (e.g. user entering Address Bar URL inside WebBrowser UI)
  app.post("/api/browser/load", async (req, res) => {
    try {
      const { urlOrQuery } = req.body;
      const data = await fetchCyberNetProxy(urlOrQuery);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to query proxy" });
    }
  });

  // API Route to handle spatial agent chat interaction
  app.post("/api/agent/converse", async (req, res) => {
    try {
      const { message, sceneState } = req.body;
      
      const systemInstruction = `
You are the Spatial Agent, an AI entity operating inside an immersive 3D desktop environment (the CyberNet Workspace).
The user speaks to you via the Agent Console. 
You can respond conversationally, AND you are equipped with spatial tools to create, remove, and fully control modules inside the zone.
You have live eyes on all active modules, their data, current browser pages, clock timers, and text buffers.

Core Directives:
1. When asked to look up something on the web, execute a query, or surf, ALWAYS invoke get_browser to open/navigate the core.web_browser.
2. When asked to write notes, document info, or initialize text blocks, ALWAYS invoke write_note to update core.notes.
3. When asked to set timers or adjust timezones, ALWAYS invoke set_clock to set timers or offsets in core.clock.
4. Execute multiple tools if the user task demands it (e.g. browsing wikipedia then logging facts into the notes buffer).
`;

      // We initialize the chat session if it does not exist to maintain conversational history
      if (!chatSession) {
        chatSession = ai.chats.create({
          model: GEMINI_MODEL,
          config: {
            systemInstruction,
            temperature: 0.3,
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "spawn_module",
                    description: "Spawns a new module into the spatial environment at a specific location.",
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        moduleId: {
                          type: Type.STRING,
                          description: "The identifier for the module to spawn. Choose from: 'core.web_browser', 'core.notes', 'core.clock'."
                        },
                        position: {
                          type: Type.ARRAY,
                          items: { type: Type.NUMBER },
                          description: "An array of 3 numbers representing the [x, y, z] unrotated position in meters."
                        },
                        reasoning: {
                          type: Type.STRING,
                          description: "Short reason for spawning this."
                        }
                      },
                      required: ["moduleId", "position", "reasoning"]
                    }
                  },
                  {
                    name: "remove_module",
                    description: "Removes an existing module from the spatial environment.",
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        instanceId: {
                          type: Type.STRING,
                          description: "The unique instanceId of the module to remove."
                        },
                        reasoning: {
                          type: Type.STRING,
                          description: "Explanation of why you are removing it."
                        }
                      },
                      required: ["instanceId", "reasoning"]
                    }
                  },
                  {
                    name: "write_note",
                    description: "Writes, appends, or modifies text inside a spatial Notes buffer (core.notes).",
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        instanceId: {
                          type: Type.STRING,
                          description: "The unique instanceId of the core.notes module."
                        },
                        text: {
                          type: Type.STRING,
                          description: "The text content to document or write."
                        },
                        mode: {
                          type: Type.STRING,
                          description: "Specify 'overwrite' to replace the page, or 'append' to add to existing content.",
                          enum: ["overwrite", "append"]
                        },
                        reasoning: {
                          type: Type.STRING,
                          description: "Scribbling reason."
                        }
                      },
                      required: ["instanceId", "text", "mode", "reasoning"]
                    }
                  },
                  {
                    name: "browse_url",
                    description: "Navigates the spatial Web Browser (core.web_browser) to a website URL or triggers search queries to analyze pages.",
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        instanceId: {
                          type: Type.STRING,
                          description: "The unique instanceId of the core.web_browser module."
                        },
                        urlOrQuery: {
                          type: Type.STRING,
                          description: "The URL to load (e.g. 'https://en.wikipedia.org/wiki/Main_Page') or search terms."
                        },
                        reasoning: {
                          type: Type.STRING,
                          description: "Direct mapping to your browsing objective."
                        }
                      },
                      required: ["instanceId", "urlOrQuery", "reasoning"]
                    }
                  },
                  {
                    name: "set_clock",
                    description: "Controls the parameters, timezone offsets, and creates active countdown timers on the Spatial Clock Module (core.clock).",
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        instanceId: {
                          type: Type.STRING,
                          description: "The unique instanceId of the core.clock module."
                        },
                        timezoneName: {
                          type: Type.STRING,
                          description: "A timezone identifier, e.g. 'UTC', 'GMT', 'America/New_York', 'Asia/Tokyo', 'PST'."
                        },
                        timerSeconds: {
                          type: Type.INTEGER,
                          description: "Seconds duration for countdown alerts (e.g., 60 for 1 minute)."
                        },
                        reasoning: {
                          type: Type.STRING,
                          description: "Time adjustment context."
                        }
                      },
                      required: ["instanceId", "reasoning"]
                    }
                  }
                ]
              }
            ]
          }
        });
      }

      // Inject the current states of modules directly in user input boundaries so Gemini can inspect them
      const userMsgWithState = `
[CURRENT WORKSPACE STATE (JSON)]:
${JSON.stringify(sceneState, null, 2)}

[USER INPUT EXECUTABLE]:
${message}
      `;

      let response = await chatSession.sendMessage({ message: userMsgWithState });
      
      let replyText = "";
      let actions: any[] = [];

      // Create a recursive tool handler to enable consecutive action calls in a single turn
      for (let attempt = 0; attempt < 5; attempt++) {
        const functionCalls = response.functionCalls;
        if (!functionCalls || functionCalls.length === 0) {
          break; // No further function calls, exit loop
        }

        const responsesToCalls: any[] = [];

        for (const call of functionCalls) {
          const args = call.args;

          if (call.name === "spawn_module") {
            actions.push({
              type: "SPAWN_MODULE",
              moduleId: args.moduleId,
              position: args.position,
            });
            replyText += `[Action: Spawning ${args.moduleId} at spatial coordinate [${args.position.join(", ")}].]\n`;
            
            responsesToCalls.push({
              functionResponse: {
                name: call.name,
                response: { status: "success", info: "Module spawned. Client instantiating physics hull." },
              },
            });
          } 
          
          else if (call.name === "remove_module") {
            actions.push({
              type: "REMOVE_MODULE",
              instanceId: args.instanceId,
            });
            replyText += `[Action: De-instantiating module ${args.instanceId}.]\n`;
            
            responsesToCalls.push({
              functionResponse: {
                name: call.name,
                response: { status: "success", info: "Module removed." },
              },
            });
          } 
          
          else if (call.name === "write_note") {
            // Read current text state to apply append/overwrite
            const matchingInst = sceneState.find((i: any) => i.id === args.instanceId);
            const currentText = matchingInst?.data?.text || "";
            const finalNoteText = args.mode === "append" ? `${currentText}\n${args.text}` : args.text;

            actions.push({
              type: "UPDATE_INSTANCE_DATA",
              instanceId: args.instanceId,
              data: {
                text: finalNoteText,
              },
            });
            replyText += `[Action: Updating local buffer in Note Module ${args.instanceId}. Mode: ${args.mode}.]\n`;

            responsesToCalls.push({
              functionResponse: {
                name: call.name,
                response: { status: "success", textResult: finalNoteText },
              },
            });
          } 
          
          else if (call.name === "browse_url") {
            replyText += `[Action: Accessing proxy node for "${args.urlOrQuery}"...]\n`;
            
            // Execute proxy crawl synchronously so Agent obtains the summarized page facts!
            const crawlResult = await fetchCyberNetProxy(args.urlOrQuery);

            actions.push({
              type: "UPDATE_INSTANCE_DATA",
              instanceId: args.instanceId,
              data: {
                url: crawlResult.url,
                title: crawlResult.title,
                type: crawlResult.type,
                summary: crawlResult.summary,
                sections: crawlResult.sections,
                links: crawlResult.links,
                searchResults: crawlResult.searchResults,
              },
            });

            replyText += `[Action: Successfully navigated ${args.instanceId} to "${crawlResult.title}".]\n`;

            responsesToCalls.push({
              functionResponse: {
                name: call.name,
                response: {
                  status: "success",
                  url: crawlResult.url,
                  title: crawlResult.title,
                  summary: crawlResult.summary,
                  type: crawlResult.type,
                },
              },
            });
          } 
          
          else if (call.name === "set_clock") {
            const clockUpdates: any = {};
            if (args.timezoneName) {
              clockUpdates.timezoneName = args.timezoneName;
            }
            if (args.timerSeconds !== undefined) {
              clockUpdates.timerRemaining = args.timerSeconds;
            }

            actions.push({
              type: "UPDATE_INSTANCE_DATA",
              instanceId: args.instanceId,
              data: clockUpdates,
            });
            replyText += `[Action: Synced parameters of Clock Module ${args.instanceId}. Timezone: ${args.timezoneName || "Unchanged"}, Timer: ${args.timerSeconds !== undefined ? `${args.timerSeconds}s` : "Unchanged"}.]\n`;

            responsesToCalls.push({
              functionResponse: {
                name: call.name,
                response: { status: "success", clockUpdates },
              },
            });
          }
        }

        // Send back the execution results of the tools to get next conversational block or consecutive tool chain requests
        response = await chatSession.sendMessage({ message: responsesToCalls });
      }

      // Append final conversational explanation from the model
      if (response.text) {
        replyText += response.text;
      }

      res.json({ text: replyText, actions });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with AI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Using model-agnostic Gemini model config: ${GEMINI_MODEL}`);
  });
}

startServer();
