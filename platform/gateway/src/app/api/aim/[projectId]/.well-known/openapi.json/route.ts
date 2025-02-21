import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    const projectId = params.projectId

    // Basic OpenAPI spec for AIM API
    const openApiSpec = {
        openapi: "3.0.0",
        info: {
            title: "AIM API",
            version: "1.0.0",
            description: "API specification for AIM project"
        },
        servers: [
            {
                url: `/api/aim/${projectId}`,
                description: "Project API endpoint"
            }
        ],
        paths: {
            "/chat": {
                post: {
                    summary: "Chat with the project's AI",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            description: "User message"
                                        }
                                    },
                                    required: ["message"]
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Successful response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            response: {
                                                type: "string",
                                                description: "AI response"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return NextResponse.json(openApiSpec)
}
