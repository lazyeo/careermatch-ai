import { createClient } from "@/lib/supabase-server";
import { enqueueAutomaticJobAnalysis } from "@/lib/jobs/enqueue-job-analysis";
import { assertTriggerSecretMatchesDeployment } from "@/lib/trigger/validate-trigger-environment";
import { tasks } from "@trigger.dev/sdk/v3";
import { NextRequest, NextResponse } from "next/server";
import {
  parseJobContent,
  parseJobFromUrl,
  type ParsedJobData,
} from "@careermatch/job-scraper";
import { completeJobParsingPrompt } from "@/lib/jobs/job-parser-ai";

type ImportJobMetadata = Partial<
  Pick<
    ParsedJobData,
    | "application_url"
    | "company"
    | "description"
    | "job_type"
    | "location"
    | "title"
  >
>;

function cleanMetadataValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || undefined;
}

function normalizeImportMetadata(
  value: unknown,
): ImportJobMetadata | undefined {
  if (!value || typeof value !== "object") return undefined;

  const source = value as Record<string, unknown>;
  const metadata: ImportJobMetadata = {
    application_url: cleanMetadataValue(source.application_url),
    company: cleanMetadataValue(source.company),
    description: cleanMetadataValue(source.description),
    job_type: cleanMetadataValue(source.job_type) as ParsedJobData["job_type"],
    location: cleanMetadataValue(source.location),
    title: cleanMetadataValue(source.title),
  };

  return Object.values(metadata).some(Boolean) ? metadata : undefined;
}

function buildContentWithMetadata(
  content: string,
  metadata: ImportJobMetadata | undefined,
  url: string | undefined,
): string {
  if (!metadata) return content;

  // Extension captures already include metadata in semantic HTML. Avoid
  // prepending plain text, because that degrades the saved original post layout.
  if (/^\s*</.test(content)) {
    return content;
  }

  const metadataLines = [
    metadata.title ? `Job title: ${metadata.title}` : "",
    metadata.company ? `Company: ${metadata.company}` : "",
    metadata.location ? `Location: ${metadata.location}` : "",
    metadata.job_type ? `Job type: ${metadata.job_type}` : "",
    `Source URL: ${metadata.application_url || url || ""}`,
  ].filter(Boolean);

  return `${metadataLines.join("\n")}\n\n${content}`;
}

function mergeParsedDataWithMetadata(
  parsedData: ParsedJobData,
  metadata: ImportJobMetadata | undefined,
  url: string | undefined,
): ParsedJobData {
  if (!metadata) {
    return {
      ...parsedData,
      application_url: parsedData.application_url || url,
    };
  }

  return {
    ...parsedData,
    title: parsedData.title || metadata.title || "",
    company: parsedData.company || metadata.company || "",
    location: parsedData.location || metadata.location,
    job_type: parsedData.job_type || metadata.job_type,
    description: parsedData.description || metadata.description,
    application_url:
      parsedData.application_url || metadata.application_url || url,
  };
}

/**
 * POST /api/jobs/import
 * 导入岗位信息（从URL或文本内容）
 */
export async function POST(request: NextRequest) {
  console.log("🚀 [API] Received POST /api/jobs/import request");
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("🔌 [API] Import Request Body:", JSON.stringify(body, null, 2));

    const { url, urls, content, save_immediately, language } = body as {
      url?: string;
      urls?: string[];
      content?: string;
      save_immediately?: boolean;
      language?: string;
    };
    const metadata = normalizeImportMetadata(
      (body as { metadata?: unknown }).metadata,
    );

    console.log(
      `👤 [API] User: ${user.id}, Save Immediately: ${save_immediately}`,
    );

    // Normalize input to array of items to process
    const itemsToProcess: { type: "url" | "content"; value: string }[] = [];

    // Prioritize content (HTML) if provided, especially for extension usage
    // This avoids server-side scraping which is often blocked by Seek/LinkedIn
    if (content) {
      itemsToProcess.push({ type: "content", value: content });
    } else if (urls && Array.isArray(urls) && urls.length > 0) {
      urls.forEach((u) => {
        if (u && u.trim())
          itemsToProcess.push({ type: "url", value: u.trim() });
      });
    } else if (url) {
      itemsToProcess.push({ type: "url", value: url });
    }

    if (itemsToProcess.length === 0) {
      return NextResponse.json(
        { error: "Please provide URLs or job content" },
        { status: 400 },
      );
    }

    const results = await Promise.all(
      itemsToProcess.map(async (item, index) => {
        try {
          console.log(`\n🔍 [${index}] Processing item type: ${item.type}`);
          let parsedData: ParsedJobData;

          if (item.type === "url") {
            console.log(`📥 [${index}] Importing job from URL: ${item.value}`);
            parsedData = await parseJobFromUrl(item.value, {
              scraperUrl: process.env.SCRAPER_API_URL,
              language: language || "zh",
              aiComplete: completeJobParsingPrompt,
            });
            parsedData.application_url =
              parsedData.application_url || item.value;
          } else {
            console.log(
              `📝 [${index}] Parsing job from content (${item.value.length} chars)`,
            );
            parsedData = await parseJobContent(
              buildContentWithMetadata(item.value, metadata, url),
              {
                language: language || "zh",
                aiComplete: completeJobParsingPrompt,
              },
            );
            parsedData = mergeParsedDataWithMetadata(parsedData, metadata, url);
            console.log(
              `✅ [${index}] Parsed data - Title: ${parsedData.title}, Company: ${parsedData.company}`,
            );
          }

          if (!parsedData.title || !parsedData.company) {
            console.error(
              `❌ [${index}] Missing required fields - Title: ${parsedData.title}, Company: ${parsedData.company}`,
            );
            return {
              success: false,
              error: "Could not extract job title or company name",
              input: item.value.substring(0, 200),
              parsed_data: parsedData,
            };
          }

          if (save_immediately) {
            console.log(`💾 [${index}] Saving to database...`);
            const { data: job, error } = await supabase
              .from("jobs")
              .insert({
                user_id: user.id,
                title: parsedData.title,
                company: parsedData.company,
                location: parsedData.location || null,
                job_type: parsedData.job_type || null,
                salary_min: parsedData.salary_min || null,
                salary_max: parsedData.salary_max || null,
                salary_currency: parsedData.salary_currency || "NZD",
                description: parsedData.description || null,
                requirements: parsedData.requirements || null,
                benefits: parsedData.benefits || null,
                // Prefer formatted markdown for original_content, fallback to raw
                original_content:
                  parsedData.formatted_original_content ||
                  parsedData.original_content ||
                  null,
                // Ensure we save the URL, prioritizing the one from the extension/request
                source_url:
                  parsedData.application_url ||
                  (item.type === "url" ? item.value : null) ||
                  (item.type === "content" && url ? url : null),
                posted_date: parsedData.posted_date || null,
                deadline: parsedData.deadline || null,
                status: "saved",
              })
              .select()
              .single();

            if (error) {
              console.error(`❌ [${index}] Database error:`, error);
              throw error;
            }

            console.log(`✅ [${index}] Job saved with ID: ${job.id}`);

            let analysisTask: { taskId: string; status: "pending" } | null =
              null;
            let analysisTaskError: string | null = null;

            try {
              analysisTask = await enqueueAutomaticJobAnalysis({
                supabase,
                userId: user.id,
                jobId: job.id,
                source: "job_import",
                triggerAnalysisTask: async (payload) => {
                  assertTriggerSecretMatchesDeployment();
                  await tasks.trigger("analyze-saved-job", payload);
                },
              });
            } catch (enqueueError) {
              analysisTaskError =
                enqueueError instanceof Error
                  ? enqueueError.message
                  : "Failed to queue automatic job analysis";
              console.error(
                `❌ [${index}] Failed to queue automatic job analysis:`,
                enqueueError,
              );
            }

            return {
              success: true,
              job_id: job.id,
              parsed_data: parsedData,
              analysis_task: analysisTask,
              analysis_task_error: analysisTaskError,
              message: "Job imported, saved, and queued for automatic analysis",
            };
          }

          return {
            success: true,
            parsed_data: parsedData,
            message: "Job parsed successfully",
          };
        } catch (error) {
          console.error(`❌ Error processing item:`, error);
          return {
            success: false,
            error: (error as Error).message,
            input: item.value,
          };
        }
      }),
    );

    // Check if we have a single result to maintain backward compatibility structure if needed,
    // but for batch support it's better to return the array or a wrapper.
    // Let's return a wrapper that contains results.

    // If it was a single request (legacy), we might want to return the single object structure
    // to avoid breaking existing frontend if we hadn't updated it yet.
    // But since we are updating frontend too, we can change the response structure.
    // However, to be safe, let's return a standard structure.

    return NextResponse.json({
      success: true,
      results: results,
    });
  } catch (error) {
    console.error("Error in POST /api/jobs/import:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
