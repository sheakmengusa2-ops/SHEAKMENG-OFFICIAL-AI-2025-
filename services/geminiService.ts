import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePromptFromImage = async (imageBase64: string, mimeType: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: "Describe this image in detail. What is happening? What are the key objects? What is the style? Create a detailed and artistic prompt that could be used to regenerate a similar image.",
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });
    
    return response.text;
};

export const generateImageFromPrompt = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: aspectRatio,
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    }

    throw new Error("Image generation failed or returned no images.");
};

export const generateVideoFromImageAndPrompt = async (
    imageBase64: string,
    mimeType: string,
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    onProgress: (messageKey: string) => void
): Promise<string> => {
    onProgress("progress.initializing");
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: {
            imageBytes: imageBase64,
            mimeType: mimeType,
        },
        config: {
            numberOfVideos: 1,
            aspectRatio: aspectRatio,
        }
    });

    onProgress("progress.started");
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        onProgress("progress.checkingStatus");
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    
    onProgress("progress.finalizing");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!downloadLink) {
        throw new Error("error.videoNoLink");
    }

    onProgress("progress.downloading");
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`error.videoDownloadFailed|${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};


export interface VideoDetails {
    sunoStyleTags: string[];
    youtubeTitle: string;
    youtubeDescription: string;
    youtubeHashtags: string[];
}

export const generatePromptsFromVideo = async (videoBase64: string, mimeType: string): Promise<VideoDetails> => {
    const videoPart = {
        inlineData: {
            data: videoBase64,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: `Analyze this video. Based on its content, mood, and style, generate the following content:
        1. "sunoStyleTags": An array of descriptive tags for a music AI like Suno to create a fitting soundtrack. (e.g., "Epic cinematic", "Upbeat pop", "Lo-fi beats").
        2. "youtubeTitle": A catchy and SEO-friendly YouTube title.
        3. "youtubeDescription": A detailed YouTube description.
        4. "youtubeHashtags": An array of relevant YouTube hashtags (without the # prefix).
        Return the response as a JSON object.`,
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [videoPart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sunoStyleTags: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Descriptive tags for a music AI like Suno to create a fitting soundtrack.',
                    },
                    youtubeTitle: {
                        type: Type.STRING,
                        description: 'A catchy and SEO-friendly YouTube title.',
                    },
                    youtubeDescription: {
                        type: Type.STRING,
                        description: 'A detailed YouTube description.',
                    },
                    youtubeHashtags: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'An array of relevant YouTube hashtags (without the # prefix).',
                    },
                },
                required: ["sunoStyleTags", "youtubeTitle", "youtubeDescription", "youtubeHashtags"],
            },
        },
    });
    
    let jsonStr = response.text.trim();
    if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.substring(7);
    }
    if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    }
    
    return JSON.parse(jsonStr) as VideoDetails;
};

export const generateAudioPromptFromVideo = async (videoBase64: string, mimeType: string): Promise<string> => {
    const videoPart = {
        inlineData: {
            data: videoBase64,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: `Analyze this video's content, mood, and pacing. Generate a detailed text prompt for an AI music generator (like Suno). The prompt should describe the ideal soundtrack, including genre, mood, instruments, and tempo. For example: "An epic, orchestral cinematic track with powerful brass and soaring strings, building to a dramatic crescendo. Medium-fast tempo."`,
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [videoPart, textPart] },
    });
    
    return response.text;
};

export const recommendVideoFilter = async (videoBase64: string, mimeType: string): Promise<string> => {
    const videoPart = {
        inlineData: {
            data: videoBase64,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: `Analyze this video's mood, content, and lighting. Based on your analysis, recommend one of the following visual filters: 'Noir' (for dramatic, black and white scenes), 'Vintage' (for a warm, nostalgic feel), 'Vibrant' (to make colors pop), or 'None' (if no filter is needed). Return a single JSON object with a "filter" key, like {"filter": "Vintage"}.`,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [videoPart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    filter: {
                        type: Type.STRING,
                        description: "The recommended filter: 'Noir', 'Vintage', 'Vibrant', or 'None'.",
                    },
                },
                required: ["filter"],
            },
        },
    });
    
    let jsonStr = response.text.trim();
    const parsed = JSON.parse(jsonStr);
    return parsed.filter;
};


export const generateSpeakingVideoFromImage = async (
    imageBase64: string,
    mimeType: string,
    speechText: string,
    aspectRatio: '16:9' | '9:16',
    onProgress: (messageKey: string) => void
): Promise<string> => {
    onProgress("progress.initializing");
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: `Make the character in the image speak the following text: "${speechText}"`,
        image: {
            imageBytes: imageBase64,
            mimeType: mimeType,
        },
        config: {
            numberOfVideos: 1,
            aspectRatio: aspectRatio,
        }
    });

    onProgress("progress.started");
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        onProgress("progress.checkingStatus");
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    
    onProgress("progress.finalizing");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!downloadLink) {
        throw new Error("error.videoNoLink");
    }

    onProgress("progress.downloading");
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`error.videoDownloadFailed|${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateSpeakingPhotoPrompt = async (
    imageBase64: string,
    mimeType: string,
    speechText: string
): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: `Based on the provided image, create a detailed and creative prompt for a text-to-video AI model like Veo. The goal is to make the main character in the image appear to be speaking the following text naturally: "${speechText}"

Your prompt should include:
- A detailed description of the character (e.g., appearance, clothing, expression).
- A description of the background and environment.
- A description of the lighting and overall mood.
- Specific instructions for the character's animation, such as facial expressions, lip movements synched with the speech, and subtle body language to make the speech look realistic and engaging.
- Combine all these elements into a single, cohesive prompt.`,
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });
    
    return response.text;
};