import mammoth from "mammoth";

export type ConvertResult = {
  html: string;
  warnings: string[];
};

/**
 * Convert a .docx Buffer to HTML using mammoth.
 * Image embedding is intentionally disabled (MVP: text only).
 */
export async function convertDocx(buffer: Buffer): Promise<ConvertResult> {
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async () => ({ src: "" })),
      styleMap: [
        "p[style-name='Heading 1'] => h2:fresh",
        "p[style-name='Heading 2'] => h3:fresh",
        "p[style-name='Heading 3'] => h4:fresh",
        "p[style-name='Quote'] => blockquote > p:fresh",
        "p[style-name='Intense Quote'] => blockquote.intense > p:fresh",
      ],
    }
  );
  return {
    html: stripEmptyImages(result.value),
    warnings: result.messages.map((m) => m.message),
  };
}

function stripEmptyImages(html: string): string {
  return html.replace(/<img[^>]*>/g, "");
}

/**
 * Convert a legacy .doc file using CloudConvert API.
 * Returns the resulting .docx buffer (caller passes it through convertDocx).
 *
 * Returns null when CLOUDCONVERT_API_KEY is missing — caller should display a
 * friendly message asking the author to save the file as .docx.
 */
export async function convertDocToDocx(
  buffer: Buffer,
  filename: string
): Promise<Buffer | null> {
  const apiKey = process.env.CLOUDCONVERT_API_KEY;
  if (!apiKey) return null;

  const createRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      tasks: {
        "import-1": { operation: "import/upload" },
        "convert-1": {
          operation: "convert",
          input: "import-1",
          input_format: "doc",
          output_format: "docx",
        },
        "export-1": { operation: "export/url", input: "convert-1" },
      },
    }),
  });
  if (!createRes.ok) {
    throw new Error(`CloudConvert create job failed: ${createRes.status}`);
  }
  const job = (await createRes.json()) as {
    data: {
      id: string;
      tasks: {
        name: string;
        operation: string;
        result?: { form: { url: string; parameters: Record<string, string> } };
      }[];
    };
  };

  const importTask = job.data.tasks.find((t) => t.name === "import-1");
  if (!importTask?.result?.form) {
    throw new Error("CloudConvert did not return an upload form");
  }
  const form = new FormData();
  for (const [k, v] of Object.entries(importTask.result.form.parameters)) {
    form.append(k, v);
  }
  const blob = new Blob([buffer as unknown as BlobPart], {
    type: "application/msword",
  });
  form.append("file", blob, filename);
  const uploadRes = await fetch(importTask.result.form.url, {
    method: "POST",
    body: form,
  });
  if (!uploadRes.ok) {
    throw new Error(`CloudConvert upload failed: ${uploadRes.status}`);
  }

  const waitRes = await fetch(
    `https://api.cloudconvert.com/v2/jobs/${job.data.id}/wait`,
    {
      headers: { authorization: `Bearer ${apiKey}` },
    }
  );
  if (!waitRes.ok) {
    throw new Error(`CloudConvert wait failed: ${waitRes.status}`);
  }
  const finished = (await waitRes.json()) as {
    data: {
      tasks: { name: string; result?: { files?: { url: string }[] } }[];
    };
  };
  const exportTask = finished.data.tasks.find((t) => t.name === "export-1");
  const url = exportTask?.result?.files?.[0]?.url;
  if (!url) throw new Error("CloudConvert did not return a download URL");
  const downloaded = await fetch(url);
  if (!downloaded.ok) {
    throw new Error(`CloudConvert download failed: ${downloaded.status}`);
  }
  const arr = await downloaded.arrayBuffer();
  return Buffer.from(new Uint8Array(arr));
}
