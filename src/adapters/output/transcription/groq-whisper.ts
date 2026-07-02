import { TranscriptionFailed } from "@/domain/extraction/errors/transcription-failed";
import type {
  ITranscriberLLMProvider,
  TranscriptionRequest,
  TranscriptionResult,
} from "@/domain/extraction/ports/http/transcriber-llm-provider";

export class GroqWhisperTranscriberLLMProvider
  implements ITranscriberLLMProvider
{
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
      throw new TranscriptionFailed({ cause });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new TranscriptionFailed({ cause: body });
    }

    const json = (await response.json()) as { text?: string };
    if (typeof json.text !== "string") {
      throw new TranscriptionFailed({ cause: "empty transcription" });
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
