import { ExtractionSourceType } from "@/domain/extraction/enums/extraction-source-type";
import { ValueObject } from "@/domain/shared/value-object";

interface ExtractionSourceProps {
  type: ExtractionSourceType;
  /** Present when `type` is Text. */
  text?: string;
  /** Present when `type` is Audio. */
  file?: Blob;
  filename?: string;
}

/**
 * The input the caller submitted: raw text XOR an audio file (mutually exclusive — the
 * HTTP edge enforces exactly one). Built via the factories so an invalid combination
 * (text with a file, etc.) is unrepresentable.
 */
export class ExtractionSource extends ValueObject<ExtractionSourceProps> {
  private constructor(props: ExtractionSourceProps) {
    super(props);
  }

  static text(text: string): ExtractionSource {
    return new ExtractionSource({ type: ExtractionSourceType.Text, text });
  }

  static audio(file: Blob, filename: string): ExtractionSource {
    return new ExtractionSource({
      type: ExtractionSourceType.Audio,
      file,
      filename,
    });
  }

  get type(): ExtractionSourceType {
    return this.props.type;
  }

  isText(): boolean {
    return this.props.type === ExtractionSourceType.Text;
  }

  isAudio(): boolean {
    return this.props.type === ExtractionSourceType.Audio;
  }

  /** The raw text; only meaningful when `isText()`. */
  get text(): string {
    return this.props.text ?? "";
  }

  /** The uploaded audio; only meaningful when `isAudio()`. */
  get file(): Blob {
    if (!this.props.file) {
      throw new Error("ExtractionSource: no audio file on a text source");
    }
    return this.props.file;
  }

  get filename(): string {
    return this.props.filename ?? "audio";
  }
}
