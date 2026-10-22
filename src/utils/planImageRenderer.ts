import { AnalysisResult } from '../types';

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (ctx.measureText(currentLine).width > maxWidth) {
        let charBuffer = '';
        for (const char of currentLine) {
          if (ctx.measureText(charBuffer + char).width > maxWidth) {
            lines.push(charBuffer);
            charBuffer = char;
          } else {
            charBuffer += char;
          }
        }
        currentLine = charBuffer;
      }
    } else if (metrics.width > maxWidth && !currentLine) {
      let charBuffer = '';
      for (const char of word) {
        if (ctx.measureText(charBuffer + char).width > maxWidth) {
          lines.push(charBuffer);
          charBuffer = char;
        } else {
          charBuffer += char;
        }
      }
      currentLine = charBuffer;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

const FONT_FAMILY = '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

export function generatePlanCanvas(
  result: AnalysisResult,
  completedTasks: Record<number, boolean>
): HTMLCanvasElement {
  const { sevenDayPlan, problemAnalysis, finalRecommendation } = result;
  const hasRequestedComparison = (result.optionsComparison?.length ?? 0) >= 2;

  const width = 1100;
  const padding = 50;
  const contentWidth = width - padding * 2;

  // Virtual measuring canvas to calculate exact required height
  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = width;
  measureCanvas.height = 100;
  const mCtx = measureCanvas.getContext('2d')!;

  // Measure content heights
  mCtx.font = `14px ${FONT_FAMILY}`;
  const dilemmaLines = wrapText(mCtx, problemAnalysis.coreDilemma, contentWidth - 40);

  mCtx.font = `bold 15px ${FONT_FAMILY}`;
  const recSummaryLines = hasRequestedComparison ? wrapText(mCtx, finalRecommendation.summary, contentWidth - 40) : [];

  mCtx.font = `14px ${FONT_FAMILY}`;
  const recReasonLines = hasRequestedComparison ? wrapText(mCtx, `비교 참고: ${finalRecommendation.reason}`, contentWidth - 40) : [];

  // Measure each day card
  const dayCardHeights: number[] = [];
  for (const day of sevenDayPlan) {
    mCtx.font = `bold 14px ${FONT_FAMILY}`;
    const taskLines = wrapText(mCtx, `할 일: ${day.task}`, contentWidth - 60);

    mCtx.font = `13px ${FONT_FAMILY}`;
    const criteriaLines = wrapText(mCtx, `완료 기준: ${day.completionCriteria}`, contentWidth - 60);

    const cardHeight = 65 + taskLines.length * 20 + criteriaLines.length * 18 + 15;
    dayCardHeights.push(cardHeight);
  }

  // Calculate total height
  let totalHeight =
    padding +
    60 + // Header (Title + Date)
    20 + // Spacing
    (40 + dilemmaLines.length * 20) + // Dilemma box
    20 + // Spacing
    (50 + recSummaryLines.length * 22 + recReasonLines.length * 20) + // Recommendation box
    25; // Spacing before days

  for (const h of dayCardHeights) {
    totalHeight += h + 15; // Day card + gap
  }

  totalHeight += 50 + padding; // Footer + bottom padding

  // Create actual high-resolution canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.max(800, Math.ceil(totalHeight));
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let currentY = padding;

  // 1. Header
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 26px ${FONT_FAMILY}`;
  ctx.fillText('ChoicePilot 7일 실행 계획', padding, currentY + 26);

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.fillStyle = '#64748b';
  ctx.font = `13px ${FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, width - padding, currentY + 24);
  ctx.textAlign = 'left';

  currentY += 50;

  // 2. Dilemma Box
  const dilemmaBoxHeight = 35 + dilemmaLines.length * 20;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(padding, currentY, contentWidth, dilemmaBoxHeight, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText('고민 내용', padding + 16, currentY + 22);

  ctx.fillStyle = '#1e293b';
  ctx.font = `14px ${FONT_FAMILY}`;
  let lineY = currentY + 42;
  for (const line of dilemmaLines) {
    ctx.fillText(line, padding + 16, lineY);
    lineY += 20;
  }

  currentY += dilemmaBoxHeight + 15;

  // 3. Recommendation Box
  const recBoxHeight = hasRequestedComparison ? 45 + recSummaryLines.length * 22 + recReasonLines.length * 20 : 0;
  if (hasRequestedComparison) {
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(padding, currentY, contentWidth, recBoxHeight, 12);
  ctx.fill();

  ctx.fillStyle = '#94a3b8';
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText('선택지 비교 참고', padding + 20, currentY + 26);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  let recY = currentY + 50;
  for (const line of recSummaryLines) {
    ctx.fillText(line, padding + 20, recY);
    recY += 22;
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.font = `14px ${FONT_FAMILY}`;
  recY += 4;
  for (const line of recReasonLines) {
    ctx.fillText(line, padding + 20, recY);
    recY += 20;
  }

  currentY += recBoxHeight + (hasRequestedComparison ? 25 : 0);
  }

  // 4. Seven Day Plans
  for (let i = 0; i < sevenDayPlan.length; i++) {
    const day = sevenDayPlan[i];
    const isCompleted = Boolean(completedTasks[day.day]);
    const cardH = dayCardHeights[i];

    // Card background
    ctx.fillStyle = isCompleted ? '#f0fdf4' : '#ffffff';
    ctx.strokeStyle = isCompleted ? '#86efac' : '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padding, currentY, contentWidth, cardH, 10);
    ctx.fill();
    ctx.stroke();

    // Day badge
    const badgeBg = isCompleted ? '#16a34a' : '#0f172a';
    ctx.fillStyle = badgeBg;
    ctx.beginPath();
    ctx.roundRect(padding + 16, currentY + 14, 40, 24, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(`D${day.day}`, padding + 36, currentY + 30);
    ctx.textAlign = 'left';

    // Day title
    ctx.fillStyle = isCompleted ? '#15803d' : '#0f172a';
    ctx.font = `bold 15px ${FONT_FAMILY}`;
    ctx.fillText(day.dayTitle, padding + 66, currentY + 31);

    // Time estimate
    ctx.fillStyle = '#64748b';
    ctx.font = `12px ${FONT_FAMILY}`;
    ctx.fillText(`(예상: ${day.estimatedMinutes})`, padding + 66 + ctx.measureText(day.dayTitle).width + 8, currentY + 31);

    // Completion Status
    const statusText = isCompleted ? '[완료]' : '[미완료]';
    ctx.fillStyle = isCompleted ? '#16a34a' : '#94a3b8';
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText(statusText, width - padding - 18, currentY + 31);
    ctx.textAlign = 'left';

    // Task
    let taskY = currentY + 56;
    mCtx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.fillStyle = isCompleted ? '#334155' : '#1e293b';
    const taskLines = wrapText(mCtx, `할 일: ${day.task}`, contentWidth - 60);
    for (const tLine of taskLines) {
      ctx.fillText(tLine, padding + 20, taskY);
      taskY += 20;
    }

    // Completion Criteria
    taskY += 2;
    mCtx.font = `13px ${FONT_FAMILY}`;
    ctx.font = `13px ${FONT_FAMILY}`;
    ctx.fillStyle = '#475569';
    const criteriaLines = wrapText(mCtx, `완료 기준: ${day.completionCriteria}`, contentWidth - 60);
    for (const cLine of criteriaLines) {
      ctx.fillText(cLine, padding + 20, taskY);
      taskY += 18;
    }

    currentY += cardH + 12;
  }

  // 5. Footer
  const totalDays = sevenDayPlan.length;
  const completedCount = sevenDayPlan.filter((d) => completedTasks[d.day]).length;
  const progressPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  ctx.fillStyle = '#64748b';
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText(
    `전체 진행률: ${completedCount}/${totalDays}일 완료 (${progressPercent}%)  |  ChoicePilot 의사결정 코칭`,
    padding,
    currentY + 25
  );

  return canvas;
}

export function exportPlanAsBlob(
  result: AnalysisResult,
  completedTasks: Record<number, boolean>
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = generatePlanCanvas(result, completedTasks);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}
