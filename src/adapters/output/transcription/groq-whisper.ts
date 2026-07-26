import { EXTRACTION_BRN } from "@/domain/extraction/brn";
import type {
  ITranscriberLLMProvider,
  TranscriptionRequest,
  TranscriptionResult,
} from "@/domain/extraction/ports/transcriber-llm-provider";
import { UpstreamError } from "@/infrastructure/helpers/errors";

function transcriptionFailed(cause: unknown): UpstreamError {
  return new UpstreamError({
    resource: EXTRACTION_BRN.resource,
    scope: EXTRACTION_BRN.scope.transcription,
    message: "Audio transcription failed",
    cause,
  });
}

export class GroqWhisperTranscriberLLMProvider implements ITranscriberLLMProvider {
  constructor(
    private readonly groqApiKey: string,
    private readonly groqModel: string,
    private readonly groqUrl: string,
  ) {}

  async transcribe(req: TranscriptionRequest): Promise<TranscriptionResult> {
    const formData = this.buildFormData(req);

    let response: Response;
    try {
      response = await fetch(this.groqUrl, {
        method: "POST",
        headers: { authorization: `Bearer ${this.groqApiKey}` },
        body: formData,
      });
    } catch (cause) {
      throw transcriptionFailed(cause);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw transcriptionFailed(body);
    }

    const json = (await response.json()) as { text?: string };
    if (typeof json.text !== "string") {
      throw transcriptionFailed("empty transcription");
    }

    return {
      text: json.text,
      model: this.groqModel,
    };
  }

  private buildFormData(req: TranscriptionRequest): FormData {
    const form = new FormData();

    form.append("file", req.file);
    form.append("model", this.groqModel);
    form.append("response_format", "json");

    return form;
  }
}
