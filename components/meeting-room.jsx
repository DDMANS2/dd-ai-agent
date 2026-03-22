"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ===== 에이전트 설정 =====
const AGENTS = [
  {
    id: "facilitator", name: "회의 진행자", emoji: "🎯",
    role: "회의 진행 · 요약 · 결론 도출", color: "#34d399",
    systemPrompt: `너는 숙련된 회의 진행자야. 너의 역할:
- 논의를 구조화하고 핵심 쟁점을 정리해
- 다른 에이전트들의 의견을 종합하고 공통점/차이점을 짚어줘
- 합의점과 미해결 쟁점을 명확히 구분해
- 결론 도출을 위해 방향을 잡아줘
반드시 한국어로, 3-4문장으로 간결하게.`,
  },
  {
    id: "strategist", name: "전략가", emoji: "♟️",
    role: "전략 분석 · 시장 인사이트", color: "#818cf8",
    systemPrompt: `너는 전략 컨설턴트야. 너의 역할:
- 시장 트렌드와 경쟁 환경을 분석해
- 장기적 관점에서 전략적 방향을 제시해
- 데이터와 사례를 근거로 논리적으로 주장해
- 다른 에이전트의 의견에 전략적 관점을 더해줘
반드시 한국어로, 3-4문장으로 간결하게.`,
  },
  {
    id: "creative", name: "크리에이터", emoji: "💡",
    role: "아이디어 · 창의적 해결책", color: "#fbbf24",
    systemPrompt: `너는 창의적 문제 해결 전문가야. 너의 역할:
- 남들이 생각하지 못한 창의적 아이디어를 제시해
- 기존 틀을 깨는 접근법을 제안해
- 비판에도 새로운 대안을 만들어내
- "이건 어떨까?" 식의 제안을 적극적으로 해
반드시 한국어로, 3-4문장으로 간결하게.`,
  },
  {
    id: "critic", name: "리스크 분석가", emoji: "⚠️",
    role: "리스크 · 반론 · 현실 점검", color: "#f87171",
    systemPrompt: `너는 리스크 분석 전문가야. 너의 역할:
- 모든 제안에 잠재적 리스크와 약점을 찾아내
- "악마의 대변인"으로서 맹점을 짚어줘
- 단순 비판이 아니라 "이런 리스크가 있으니 이렇게 보완하자"는 건설적 비판
- 낙관론에 현실적 균형을 맞춰줘
반드시 한국어로, 3-4문장으로 간결하게.`,
  },
  {
    id: "executor", name: "실행 매니저", emoji: "📋",
    role: "실행 계획 · 일정 · 우선순위", color: "#38bdf8",
    systemPrompt: `너는 프로젝트 매니저야. 너의 역할:
- 논의 내용을 구체적인 액션 아이템으로 변환해
- 누가, 언제까지, 무엇을 할지 정리해
- 우선순위를 매기고 현실적인 일정을 제안해
- 실행 가능성을 기준으로 의견을 평가해
반드시 한국어로, 3-4문장으로 간결하게.`,
  },
  {
    id: "data_analyst", name: "데이터분석가", emoji: "📊",
    role: "데이터 기반 인사이트 · 수치 분석", color: "#06b6d4",
    systemPrompt: `너는 시니어 데이터 분석가야. 너의 역할:
- 모든 주장에 대해 데이터와 수치 근거를 요구하고 제시해
- 시장 규모, 성장률, 전환율, ROI 등 핵심 지표를 분석해
- "이 수치가 의미하는 건..." 식으로 데이터를 해석해
- 감에 의존하는 의견에 데이터 기반 반박을 해
반드시 한국어로, 3-4문장으로 간결하게.`,
  },
  {
    id: "marketer", name: "마케터", emoji: "📢",
    role: "마케팅 전략 · 고객 분석 · 브랜딩", color: "#ec4899",
    systemPrompt: `너는 10년차 마케팅 전문가야. 너의 역할:
- 타겟 고객 페르소나를 정의하고 고객 여정을 분석해
- 채널별 마케팅 전략 (SNS, 광고, SEO, 콘텐츠)을 제안해
- 브랜드 포지셔닝과 차별화 메시지를 만들어
- 마케팅 예산 배분과 예상 CAC/LTV를 제시해
반드시 한국어로, 3-4문장으로 간결하게.`,
  },
  {
    id: "finance", name: "재무분석가", emoji: "💰",
    role: "재무 분석 · 수익성 · 투자 판단", color: "#f59e0b",
    systemPrompt: `너는 재무/투자 분석 전문가야. 너의 역할:
- 매출 예측, 손익분기점, 현금흐름을 분석해
- 투자 대비 수익률(ROI)과 회수 기간을 계산해
- 자금 조달 방법과 재무 리스크를 평가해
- "재무적 관점에서 보면..." 식으로 모든 제안의 수익성을 검증해
반드시 한국어로, 3-4문장으로 간결하게.`,
  },
  {
    id: "developer", name: "개발자", emoji: "👨‍💻",
    role: "기술 구현 · 시스템 설계 · 바이브코딩", color: "#10b981",
    systemPrompt: `너는 풀스택 시니어 개발자이자 바이브 코딩 전문가야. 너의 역할:
- 기술적으로 구현 가능한지 판단하고 최적의 기술 스택을 추천해
- MVP 개발에 필요한 핵심 기능과 개발 일정을 산정해
- 바이브 코딩(AI 활용 개발)으로 빠르게 만들 수 있는 방법을 제시해
- 노코드/로우코드 대안도 함께 제안해
반드시 한국어로, 3-4문장으로 간결하게.`,
  },
  {
    id: "designer", name: "디자인 분석가", emoji: "🎨",
    role: "UX/UI · 사용자 경험 · 디자인 전략", color: "#a855f7",
    systemPrompt: `너는 UX/UI 디자인 전문가야. 너의 역할:
- 사용자 경험(UX) 관점에서 서비스 흐름을 설계해
- 경쟁사 대비 디자인 차별화 포인트를 제시해
- 브랜드 아이덴티티와 일관된 디자인 방향을 제안해
- "사용자 입장에서 보면..." 식으로 항상 사용자 중심으로 사고해
반드시 한국어로, 3-4문장으로 간결하게.`,
  },
  {
    id: "sales", name: "영업 전문가", emoji: "🤝",
    role: "영업 전략 · 고객 확보 · 파트너십", color: "#ef4444",
    systemPrompt: `너는 B2B/B2C 영업 전문가야. 너의 역할:
- 초기 고객 확보 전략과 영업 파이프라인을 설계해
- 가격 정책, 수익 모델, 판매 채널을 제안해
- 파트너십과 제휴 기회를 발굴해
- "현장에서는..." 식으로 실제 고객 접점의 현실적인 의견을 줘
반드시 한국어로, 3-4문장으로 간결하게.`,
  },
];

// ===== 회의 템플릿 =====
const MEETING_TEMPLATES = [
  { id: "brainstorm", name: "브레인스토밍", icon: "🧠", desc: "자유롭게 아이디어를 발산", phases: ["아이디어 발산", "그룹핑", "투표 & 선정"] },
  { id: "decision", name: "의사결정", icon: "⚖️", desc: "옵션 비교 후 최적안 선택", phases: ["옵션 분석", "장단점 토론", "투표 & 결정"] },
  { id: "review", name: "회고/리뷰", icon: "🔄", desc: "지난 성과 돌아보기", phases: ["성과 정리", "개선점 도출", "액션 플랜"] },
  { id: "strategy", name: "전략 수립", icon: "🗺️", desc: "방향성과 실행 계획 수립", phases: ["현황 분석", "전략 제안", "실행 로드맵"] },
];

// ===== LLM 제공자 설정 =====
const LLM_PROVIDERS = [
  {
    id: "builtin", name: "서버 API (키 불필요)", icon: "✨",
    models: [
      { id: "auto", name: "서버 자동 선택", desc: "Vercel 환경변수 기반 · API 키 불필요", speed: "빠름", quality: "우수" },
    ],
    apiUrl: "/api/meeting/chat",
    keyPlaceholder: "",
    free: true, cost: "서버 환경변수 사용",
    signupUrl: "",
    format: "server", searchSupport: false,
  },
  {
    id: "anthropic", name: "Claude (Anthropic)", icon: "🟣",
    models: [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", desc: "균형잡힌 성능 · 추천", speed: "보통", quality: "최상" },
      { id: "claude-haiku-3-5-20241022", name: "Claude Haiku 3.5", desc: "빠르고 저렴", speed: "빠름", quality: "우수" },
    ],
    apiUrl: "https://api.anthropic.com/v1/messages",
    keyPlaceholder: "sk-ant-api03-...",
    free: false, cost: "~$3/100만 토큰",
    signupUrl: "https://console.anthropic.com/",
    format: "anthropic",
  },
  {
    id: "groq", name: "Groq (무료 티어)", icon: "🔵",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", desc: "무료 · 빠른 응답", speed: "매우 빠름", quality: "우수" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B", desc: "무료 · 가벼움", speed: "매우 빠름", quality: "양호" },
    ],
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    keyPlaceholder: "gsk_...",
    free: true, cost: "무료 (일일 한도 있음)",
    signupUrl: "https://console.groq.com/",
    format: "openai",
  },
  {
    id: "openai", name: "OpenAI", icon: "⚪",
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "저렴 · 빠름", speed: "빠름", quality: "우수" },
      { id: "gpt-4o", name: "GPT-4o", desc: "고성능", speed: "보통", quality: "최상" },
    ],
    apiUrl: "https://api.openai.com/v1/chat/completions",
    keyPlaceholder: "sk-proj-...",
    free: false, cost: "~$2.5/100만 토큰",
    signupUrl: "https://platform.openai.com/",
    format: "openai", searchSupport: false,
  },
  {
    id: "perplexity", name: "Perplexity (웹검색)", icon: "🔍",
    models: [
      { id: "sonar-pro", name: "Sonar Pro", desc: "웹검색 내장 · 출처 포함 · 추천", speed: "보통", quality: "최상" },
      { id: "sonar", name: "Sonar", desc: "웹검색 내장 · 가벼움", speed: "빠름", quality: "우수" },
    ],
    apiUrl: "https://api.perplexity.ai/chat/completions",
    keyPlaceholder: "pplx-...",
    free: false, cost: "~$5/월 (1000회)",
    signupUrl: "https://www.perplexity.ai/settings/api",
    format: "openai", searchSupport: "builtin",
  },
];

function loadLLMSettings() {
  try { const s = localStorage.getItem("meeting_llm_settings"); if (s) return JSON.parse(s); } catch {}
  return { providerId: "builtin", modelId: "claude-sonnet-4-20250514", apiKey: "", webSearch: false };
}
function saveLLMSettings(s) { try { localStorage.setItem("meeting_llm_settings", JSON.stringify(s)); } catch {} }

const getTimestamp = () => new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

// ===== 에이전트 아바타 =====
function AgentAvatar({ agent, state = "idle", isActive, onClick, size = "md" }) {
  const s = size === "sm" ? { c: 48, e: 22, n: 10, r: false } : { c: 68, e: 30, n: 11, r: true };
  return (
    <div onClick={onClick} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
      cursor: "pointer", opacity: isActive ? 1 : 0.35,
      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      transform: isActive ? "scale(1)" : "scale(0.88)",
    }}>
      <div style={{
        width: s.c, height: s.c, borderRadius: "50%",
        background: `linear-gradient(145deg, ${agent.color}18, ${agent.color}35)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: s.e, position: "relative",
        border: state === "speaking" ? `3px solid ${agent.color}` : state === "thinking" ? `2px solid ${agent.color}88` : "2px solid rgba(255,255,255,0.08)",
        boxShadow: state === "speaking" ? `0 0 24px ${agent.color}40, 0 0 48px ${agent.color}20` : state === "thinking" ? `0 0 12px ${agent.color}25` : "none",
        animation: state === "thinking" ? "pulse 1.8s ease-in-out infinite" : undefined,
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {agent.emoji}
        {(state === "thinking" || state === "speaking") && (
          <div style={{
            position: "absolute", bottom: -3, right: -3, width: 20, height: 20, borderRadius: "50%",
            background: `linear-gradient(135deg, ${agent.color}, ${agent.color}cc)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, boxShadow: `0 2px 8px ${agent.color}60`,
          }}>{state === "thinking" ? "💭" : "🔊"}</div>
        )}
      </div>
      <span style={{ fontSize: s.n, fontWeight: 600, color: isActive ? "#e2e8f0" : "#4a5568" }}>{agent.name}</span>
      {s.r && <span style={{ fontSize: 9, color: isActive ? `${agent.color}cc` : "#3a4458", maxWidth: 80, textAlign: "center", lineHeight: 1.3 }}>{agent.role}</span>}
    </div>
  );
}

// ===== 채팅 버블 =====
function ChatBubble({ msg, isLatest }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  const agent = AGENTS.find((a) => a.id === msg.agent);

  if (isSystem) {
    return (
      <div style={{ textAlign: "center", padding: "8px 16px", animation: "fadeSlideIn 0.4s ease" }}>
        <span style={{
          fontSize: 11, color: msg.highlight ? "#fbbf24" : "#64748b",
          background: msg.highlight ? "#fbbf2410" : "#1a2332",
          padding: "5px 14px", borderRadius: 20,
          border: `1px solid ${msg.highlight ? "#fbbf2430" : "#253344"}`,
          display: "inline-block",
        }}>{msg.content}</span>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      flexDirection: isUser ? "row-reverse" : "row",
      animation: "fadeSlideIn 0.35s cubic-bezier(0.4,0,0.2,1)",
    }}>
      {!isUser && (
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(145deg, ${agent?.color || "#334"}20, ${agent?.color || "#334"}40)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 19, border: `1px solid ${agent?.color || "#334"}30`,
        }}>{agent?.emoji || "🤖"}</div>
      )}
      <div style={{
        maxWidth: "85%", padding: "11px 15px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "linear-gradient(145deg, #172033, #1a2438)",
        color: "#e2e8f0", fontSize: 13.5, lineHeight: 1.7,
        border: isUser ? "none" : `1px solid ${agent?.color || "#334"}18`,
        boxShadow: isLatest && !isUser ? `0 2px 12px ${agent?.color || "#000"}15` : "none",
      }}>
        {!isUser && (
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5, color: agent?.color || "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
            <span>{agent?.name}</span>
            <span style={{ fontSize: 9, fontWeight: 400, color: "#546478", padding: "1px 7px", background: "#0d1520", borderRadius: 10 }}>{agent?.role}</span>
            {msg.round && <span style={{ fontSize: 9, fontWeight: 400, color: "#3a7bd5", padding: "1px 7px", background: "#3a7bd510", borderRadius: 10 }}>R{msg.round}</span>}
          </div>
        )}
        <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
        <div style={{ fontSize: 10, color: "#4a5568", marginTop: 5, textAlign: isUser ? "right" : "left" }}>{msg.timestamp}</div>
      </div>
    </div>
  );
}

// ===== 최종 결론 리포트 =====
function ConclusionReport({ data, onClose, onExport }) {
  const [activeTab, setActiveTab] = useState("conclusion");
  if (!data) return null;

  const tabs = [
    { id: "conclusion", label: "결론", icon: "🎯" },
    { id: "roadmap", label: "실행 로드맵", icon: "🗺️" },
    { id: "tools", label: "도구 & 예산", icon: "🛠️" },
    { id: "risks", label: "리스크 & KPI", icon: "⚠️" },
    ...(data.devGuide ? [{ id: "dev", label: "개발 지침", icon: "💻" }] : []),
  ];

  const difficultyColor = { "쉬움": "#34d399", "보통": "#fbbf24", "어려움": "#f87171" };

  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(12px)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeSlideIn 0.3s ease",
    }}>
      <div style={{
        background: "linear-gradient(160deg, #0f1829, #162038)",
        border: "1px solid #253344", borderRadius: 20, padding: 0,
        maxWidth: 700, width: "94%", maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid #1a2838",
          background: "linear-gradient(135deg, #34d39908, #3b82f608)",
          borderRadius: "20px 20px 0 0", flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#34d399", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>📊 최종 결론 & 실행 가이드</div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", margin: "4px 0 0" }}>{data.title || "회의 결론"}</h2>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#546478", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "7px 14px", borderRadius: 8, border: "none",
                background: activeTab === tab.id ? "#1e3a5f" : "transparent",
                color: activeTab === tab.id ? "#60a5fa" : "#546478",
                fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer", transition: "all 0.2s",
              }}>{tab.icon} {tab.label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>

          {/* === TAB: 결론 === */}
          {activeTab === "conclusion" && (
            <div style={{ animation: "fadeSlideIn 0.2s ease" }}>
              {/* 합의 */}
              {data.consensus?.length > 0 && (
                <Section title="합의된 사항" icon="✓" color="#34d399" items={data.consensus} />
              )}
              {data.majority?.length > 0 && (
                <Section title="다수 의견 (일부 유보)" icon="▸" color="#818cf8" items={data.majority} />
              )}
              {data.unresolved?.length > 0 && (
                <Section title="미해결 쟁점" icon="!" color="#fbbf24" items={data.unresolved} />
              )}
              {data.finalConclusion && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>🎯 최종 결론</h3>
                  <div style={{
                    padding: "14px 16px", background: "linear-gradient(135deg, #3b82f608, #34d39908)",
                    borderRadius: 12, border: "1px solid #253344",
                    fontSize: 13.5, color: "#e2e8f0", lineHeight: 1.7, fontWeight: 500,
                  }}>{data.finalConclusion}</div>
                </div>
              )}
              {data.kpi?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 10 }}>📈 성공 지표 (KPI)</h3>
                  {data.kpi.map((k, i) => (
                    <div key={i} style={{
                      padding: "8px 14px", background: "#a78bfa08", borderRadius: 8,
                      borderLeft: "3px solid #a78bfa", marginBottom: 5,
                      fontSize: 12.5, color: "#c8d6e5", lineHeight: 1.5,
                    }}>{k}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === TAB: 실행 로드맵 === */}
          {activeTab === "roadmap" && (
            <div style={{ animation: "fadeSlideIn 0.2s ease" }}>
              {(data.executionRoadmap || []).map((phase, pi) => (
                <div key={pi} style={{ marginBottom: 28 }}>
                  {/* Phase header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800, color: "#fff",
                    }}>{pi + 1}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{phase.phase}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: "#60a5fa", background: "#60a5fa15", padding: "2px 8px", borderRadius: 6 }}>📅 {phase.period}</span>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>{phase.goal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tasks */}
                  {(phase.tasks || []).map((task, ti) => (
                    <div key={ti} style={{
                      marginLeft: 16, padding: "14px 16px", marginBottom: 10,
                      background: "linear-gradient(145deg, #141e30, #172033)",
                      borderRadius: 12, border: "1px solid #1a2838",
                    }}>
                      {/* Task header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", flex: 1 }}>
                          {task.task}
                        </div>
                        <span style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 6, flexShrink: 0, marginLeft: 8,
                          background: `${difficultyColor[task.difficulty] || "#94a3b8"}15`,
                          color: difficultyColor[task.difficulty] || "#94a3b8",
                          fontWeight: 600,
                        }}>{task.difficulty}</span>
                      </div>

                      {/* How to */}
                      <div style={{
                        fontSize: 12, color: "#94a3b8", lineHeight: 1.7, marginBottom: 10,
                        padding: "10px 12px", background: "#0a0f1c", borderRadius: 8,
                      }}>
                        💡 <span style={{ color: "#c8d6e5" }}>{task.howTo}</span>
                      </div>

                      {/* Meta info */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {task.tools?.map((tool, idx) => (
                          <span key={idx} style={{
                            fontSize: 10, padding: "3px 8px", borderRadius: 6,
                            background: "#38bdf810", color: "#38bdf8", border: "1px solid #38bdf820",
                          }}>🔧 {tool}</span>
                        ))}
                        {task.cost && (
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "#34d39910", color: "#34d399" }}>
                            💰 {task.cost}
                          </span>
                        )}
                        {task.duration && (
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "#fbbf2410", color: "#fbbf24" }}>
                            ⏱ {task.duration}
                          </span>
                        )}
                      </div>

                      {/* Tip */}
                      {task.tip && (
                        <div style={{
                          marginTop: 8, fontSize: 11, color: "#fbbf24", fontStyle: "italic",
                          padding: "6px 10px", background: "#fbbf2406", borderRadius: 6,
                        }}>💬 Tip: {task.tip}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {data.resources?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", marginBottom: 10 }}>📚 참고 리소스</h3>
                  {data.resources.map((r, i) => (
                    <div key={i} style={{
                      padding: "8px 12px", background: "#818cf808", borderRadius: 8,
                      borderLeft: "3px solid #818cf8", marginBottom: 5,
                      fontSize: 12, color: "#c8d6e5", lineHeight: 1.5,
                    }}>{r}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === TAB: 도구 & 예산 === */}
          {activeTab === "tools" && (
            <div style={{ animation: "fadeSlideIn 0.2s ease" }}>
              {/* Tech Stack */}
              {data.techStack?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", marginBottom: 12 }}>🛠️ 추천 도구 & 기술</h3>
                  {data.techStack.map((tech, i) => (
                    <div key={i} style={{
                      padding: "14px 16px", background: "linear-gradient(145deg, #141e30, #172033)",
                      borderRadius: 12, border: "1px solid #1a2838", marginBottom: 8,
                    }}>
                      <div style={{ fontSize: 10, color: "#546478", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                        {tech.category}
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                        <div>
                          <span style={{ fontSize: 12, color: "#38bdf8", fontWeight: 600 }}>추천: </span>
                          <span style={{ fontSize: 12.5, color: "#e2e8f0", fontWeight: 600 }}>{tech.recommended}</span>
                        </div>
                        {tech.free && (
                          <div>
                            <span style={{ fontSize: 11, color: "#34d399" }}>무료: </span>
                            <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{tech.free}</span>
                          </div>
                        )}
                      </div>
                      {tech.reason && (
                        <div style={{ fontSize: 11, color: "#7a8a9e", marginTop: 6, lineHeight: 1.5 }}>{tech.reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Budget */}
              {data.budget && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#34d399", marginBottom: 12 }}>💰 예산 가이드</h3>
                  <div style={{
                    padding: "16px", background: "linear-gradient(145deg, #141e30, #172033)",
                    borderRadius: 12, border: "1px solid #1a2838",
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                      <div style={{ padding: "10px 14px", background: "#34d39908", borderRadius: 10, borderLeft: "3px solid #34d399" }}>
                        <div style={{ fontSize: 10, color: "#34d399", fontWeight: 600, marginBottom: 4 }}>최소 예산</div>
                        <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{data.budget.minimum}</div>
                      </div>
                      <div style={{ padding: "10px 14px", background: "#3b82f608", borderRadius: 10, borderLeft: "3px solid #3b82f6" }}>
                        <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 600, marginBottom: 4 }}>권장 예산</div>
                        <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{data.budget.recommended}</div>
                      </div>
                    </div>
                    {data.budget.breakdown?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: "#546478", fontWeight: 600, marginBottom: 6 }}>세부 내역</div>
                        {data.budget.breakdown.map((b, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "4px 0", borderBottom: "1px solid #1a283822", lineHeight: 1.5 }}>
                            {b}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === TAB: 리스크 & KPI === */}
          {activeTab === "risks" && (
            <div style={{ animation: "fadeSlideIn 0.2s ease" }}>
              {data.risks?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 12 }}>⚠️ 리스크 & 대응 방안</h3>
                  {data.risks.map((r, i) => (
                    <div key={i} style={{
                      padding: "14px 16px", background: "linear-gradient(145deg, #141e30, #172033)",
                      borderRadius: 12, border: "1px solid #1a2838", marginBottom: 8,
                    }}>
                      <div style={{ fontSize: 12.5, color: "#f87171", fontWeight: 600, marginBottom: 6 }}>
                        🔴 {r.risk}
                      </div>
                      <div style={{
                        fontSize: 12, color: "#94a3b8", lineHeight: 1.6,
                        padding: "8px 12px", background: "#34d39908", borderRadius: 8,
                        borderLeft: "3px solid #34d399",
                      }}>
                        ✅ 대응: {r.prevention}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.kpi?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 12 }}>📈 핵심 성과 지표 (KPI)</h3>
                  {data.kpi.map((k, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 10, alignItems: "center",
                      padding: "10px 14px", background: "#a78bfa08", borderRadius: 10,
                      marginBottom: 6, borderLeft: "3px solid #a78bfa",
                    }}>
                      <span style={{
                        fontSize: 10, color: "#a78bfa", fontWeight: 700, flexShrink: 0,
                        background: "#a78bfa15", width: 22, height: 22, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 12.5, color: "#c8d6e5", lineHeight: 1.5 }}>{k}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

          {/* === TAB: 개발 지침 === */}
          {activeTab === "dev" && data.devGuide && (
            <div style={{ animation: "fadeSlideIn 0.2s ease" }}>
              <div style={{ marginBottom: 20, padding: "16px", background: "linear-gradient(135deg, #3b82f608, #818cf808)", borderRadius: 12, border: "1px solid #253344" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>💻 {data.devGuide.summary || "시스템 개발 지침"}</div>
                {data.devGuide.architecture && <div style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.7 }}>{data.devGuide.architecture}</div>}
              </div>

              {data.devGuide.techStack && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", marginBottom: 10 }}>🛠️ 기술 스택</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {Object.entries(data.devGuide.techStack).map(([key, val]) => val && (
                      <div key={key} style={{ padding: "10px 12px", background: "#0a0f1c", borderRadius: 10, borderLeft: "3px solid #38bdf8" }}>
                        <div style={{ fontSize: 10, color: "#546478", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>{key}</div>
                        <div style={{ fontSize: 12.5, color: "#e2e8f0", fontWeight: 500 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.devGuide.mvpFeatures?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#34d399", marginBottom: 10 }}>🎯 MVP 핵심 기능</h3>
                  {data.devGuide.mvpFeatures.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "8px 12px", background: "#34d39908", borderRadius: 8, marginBottom: 4, borderLeft: "3px solid #34d399" }}>
                      <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>✓</span>
                      <span style={{ fontSize: 12.5, color: "#c8d6e5" }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {data.devGuide.devPhases?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", marginBottom: 10 }}>📅 개발 단계 가이드</h3>
                  {data.devGuide.devPhases.map((phase, pi) => (
                    <div key={pi} style={{ marginBottom: 14, padding: "14px 16px", background: "linear-gradient(145deg, #141e30, #172033)", borderRadius: 12, border: "1px solid #1a2838" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{phase.phase}</span>
                        <span style={{ fontSize: 10, color: "#60a5fa", background: "#60a5fa15", padding: "2px 8px", borderRadius: 6 }}>📅 {phase.period}</span>
                      </div>
                      {phase.tasks?.map((t, ti) => (
                        <div key={ti} style={{ fontSize: 12, color: "#94a3b8", padding: "2px 0" }}>• {t}</div>
                      ))}
                      {phase.vibePrompt && (
                        <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "#fbbf2408", border: "1px solid #fbbf2420" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>🪄 바이브 코딩 프롬프트</div>
                          <div style={{ fontSize: 11.5, color: "#e2e8f0", lineHeight: 1.6, fontFamily: "monospace", whiteSpace: "pre-wrap", padding: "8px 10px", background: "#0a0f1c", borderRadius: 6 }}>{phase.vibePrompt}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {data.devGuide.vibeGuide && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 10 }}>🪄 바이브 코딩 가이드</h3>
                  <div style={{ padding: "14px 16px", background: "linear-gradient(145deg, #141e30, #172033)", borderRadius: 12, border: "1px solid #fbbf2420" }}>
                    {data.devGuide.vibeGuide.tool && <div style={{ fontSize: 12.5, color: "#e2e8f0", marginBottom: 10 }}><span style={{ color: "#fbbf24", fontWeight: 600 }}>추천 도구:</span> {data.devGuide.vibeGuide.tool}</div>}
                    {data.devGuide.vibeGuide.tips?.map((tip, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "2px 0" }}>💡 {tip}</div>
                    ))}
                    {data.devGuide.vibeGuide.samplePrompts?.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#7a8a9e", marginBottom: 6 }}>📝 복사해서 쓸 수 있는 프롬프트</div>
                        {data.devGuide.vibeGuide.samplePrompts.map((p, i) => (
                          <div key={i} style={{ padding: "8px 10px", marginBottom: 6, borderRadius: 6, background: "#0a0f1c", border: "1px solid #1a2838", fontSize: 11.5, color: "#e2e8f0", lineHeight: 1.6, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{p}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {data.devGuide.noCodeAlternative && (
                  <div style={{ padding: "12px 14px", background: "#34d39908", borderRadius: 10, borderLeft: "3px solid #34d399" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#34d399", marginBottom: 4 }}>🧩 노코드 대안</div>
                    <div style={{ fontSize: 12, color: "#c8d6e5", lineHeight: 1.5 }}>{data.devGuide.noCodeAlternative}</div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {data.devGuide.estimatedTime && (
                    <div style={{ padding: "8px 12px", background: "#60a5fa08", borderRadius: 8, borderLeft: "3px solid #60a5fa" }}>
                      <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 600 }}>⏱ 예상 시간</div>
                      <div style={{ fontSize: 12, color: "#c8d6e5" }}>{data.devGuide.estimatedTime}</div>
                    </div>
                  )}
                  {data.devGuide.estimatedCost && (
                    <div style={{ padding: "8px 12px", background: "#fbbf2408", borderRadius: 8, borderLeft: "3px solid #fbbf24" }}>
                      <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 600 }}>💰 예상 비용</div>
                      <div style={{ fontSize: 12, color: "#c8d6e5" }}>{data.devGuide.estimatedCost}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Footer */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid #1a2838",
          display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: "9px 18px", borderRadius: 10, border: "1px solid #253344",
            background: "transparent", color: "#94a3b8", fontSize: 12.5, cursor: "pointer",
          }}>닫기</button>
          <button onClick={onExport} style={{
            padding: "9px 18px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}>💾 전체 리포트 저장</button>
        </div>
      </div>
    </div>
  );
}

// 섹션 렌더 헬퍼
function Section({ title, icon, color, items }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 20, height: 20, borderRadius: "50%", background: `${color}20`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{icon}</span>
        {title}
      </h3>
      {items.map((item, i) => (
        <div key={i} style={{
          padding: "10px 14px", background: `${color}08`, borderRadius: 10,
          borderLeft: `3px solid ${color}`, marginBottom: 6,
          fontSize: 13, color: "#c8d6e5", lineHeight: 1.6,
        }}>{item}</div>
      ))}
    </div>
  );
}

// ===== 자동 수렴 진행 표시 =====
function ConvergenceProgress({ currentRound, maxRounds, roundLabels, status }) {
  return (
    <div style={{
      padding: "10px 20px", background: "linear-gradient(90deg, #fbbf2408, #34d39908)",
      borderBottom: "1px solid #253344", display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {roundLabels.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: i < currentRound ? "linear-gradient(135deg, #34d399, #059669)" :
                         i === currentRound ? "linear-gradient(135deg, #fbbf24, #d97706)" : "#1a2535",
              color: i <= currentRound ? "#fff" : "#3a4458",
              border: i === currentRound ? "2px solid #fbbf24" : "none",
              boxShadow: i === currentRound ? "0 0 12px #fbbf2440" : "none",
              transition: "all 0.4s ease",
            }}>{i + 1}</div>
            {i < roundLabels.length - 1 && (
              <div style={{ width: 20, height: 2, background: i < currentRound ? "#34d399" : "#253344", borderRadius: 1, transition: "all 0.4s ease" }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{roundLabels[currentRound] || "완료"}</div>
        <div style={{ fontSize: 10, color: "#546478" }}>{status}</div>
      </div>
      {currentRound < maxRounds && (
        <div style={{ fontSize: 10, color: "#fbbf24", animation: "pulse 1.5s infinite" }}>진행 중...</div>
      )}
    </div>
  );
}

// ===== 도움말 모달 =====
function HelpModal({ onClose, isMobile }) {
  const [tab, setTab] = useState("start");
  const tabs = [
    { id: "start", label: "시작하기", icon: "🚀" },
    { id: "modes", label: "회의 모드", icon: "🔄" },
    { id: "commands", label: "명령어", icon: "⌨️" },
    { id: "agents", label: "에이전트", icon: "🤖" },
    { id: "search", label: "웹 검색", icon: "🌐" },
    { id: "report", label: "결론 리포트", icon: "📊" },
    { id: "speed", label: "속도 & 문제해결", icon: "⚡" },
    { id: "tips", label: "활용 팁", icon: "💡" },
  ];

  const content = {
    start: [
      { q: "이게 뭐예요?", a: "DD Ai 에이전트 11명이 각자 역할에 맞게 회의하듯 토론하고, 최종 결론과 실행 가이드를 자동으로 만들어주는 도구입니다.\n\n기본 5명이 활성화되어 있고, 필요에 따라 데이터분석가, 마케터, 재무분석가, 개발자, 디자인분석가, 영업전문가를 추가할 수 있어요." },
      { q: "어떻게 시작하나요?", a: "1. ✨ 내장 Claude가 기본 선택 — API 키 없이 바로 시작!\n2. 회의 모드 선택 (자동 수렴 추천)\n3. 회의 유형 선택 또는 자유 회의\n4. 주제를 입력하면 에이전트들이 토론 시작!\n\n다른 LLM을 쓰고 싶다면 ⚙️ 버튼에서 변경." },
      { q: "API 키 없이 쓸 수 있나요?", a: "네! ✨ 내장 Claude가 기본 선택이라 API 키 없이 바로 사용 가능합니다.\n\n배포 후 다른 LLM을 쓰고 싶다면:\n• 무료: Cerebras, Groq\n• 유료: Anthropic, OpenAI, Perplexity\n⚙️ 설정에서 변경 가능." },
      { q: "LLM 모델 변경 방법", a: "⚙️ 버튼 클릭 → 제공자 선택 → 모델 선택 → API 키 입력 (내장 Claude 제외)\n\n로비에서도 회의 중에서도 변경 가능합니다." },
    ],
    modes: [
      { q: "🎮 수동 진행 모드", a: "직접 대화 흐름을 컨트롤합니다.\n• 주제 입력 → 에이전트 답변\n• 🔥토론 버튼으로 후속 토론 시작\n• 📊결론 버튼으로 원하는 시점에 결론 도출\n• 중간에 추가 질문/방향 전환 가능" },
      { q: "🔄 자동 수렴 모드 (추천)", a: "주제만 던지면 알아서 결론까지!\n• R1: 각 에이전트 초기 의견 제시\n• R2: 서로 반박/보완하며 토론\n• R3: 의견 수렴 및 합의 시도\n• 자동으로 최종 결론 리포트 생성\n\n⏹ 버튼으로 중간에 멈출 수 있어요." },
      { q: "회의 유형은 뭔가요?", a: "🧠 브레인스토밍: 아이디어 발산 → 투표\n⚖️ 의사결정: 옵션 비교 → 최적안 선택\n🔄 회고/리뷰: 성과 분석 → 개선점 도출\n🗺️ 전략 수립: 현황 분석 → 로드맵\n\n또는 자유 회의로 시작할 수도 있습니다." },
    ],
    commands: [
      { q: "/결론", a: "현재까지 논의 내용을 분석하여 최종 결론 리포트를 생성합니다.\n\n포함 내용:\n• 합의사항/다수의견/미해결 쟁점\n• 실행 로드맵 (단계별 가이드)\n• 도구 & 예산\n• 리스크 & KPI\n• 개발 지침 (개발 관련 주제일 때 자동 추가)" },
      { q: "🔥 토론 버튼", a: "에이전트들이 서로의 의견을 이름으로 언급하며 추가 토론 라운드를 진행합니다. 수동 모드에서 사용." },
      { q: "📊 결론 버튼", a: "/결론 명령어와 동일합니다. 3개 이상의 메시지가 있을 때 활성화." },
      { q: "⏹ 중단 버튼", a: "자동 수렴 진행 중 나타납니다. 누르면 즉시 모든 처리가 중단되고 새 주제를 입력할 수 있어요." },
      { q: "🔄 강제 초기화 버튼", a: "2분 이상 응답이 없을 때 자동으로 나타납니다.\n• 안 누르면: 진행 중인 작업 계속 기다림\n• 누르면: 모든 것 즉시 중단 + 새로 시작 가능\n\n대부분 기다리면 알아서 진행되니, 완전히 멈췄을 때만 사용하세요." },
      { q: "🎙️ 음성 입력", a: "마이크 버튼으로 한국어 음성 입력. Chrome 브라우저 권장.\n⚠️ 미리보기에서는 제한됨 — 배포 후 정상 작동." },
      { q: "🔊 음성 출력", a: "에이전트 답변을 한국어 TTS로 읽어줍니다. 헤더의 🔊/🔇 버튼으로 ON/OFF.\n⚠️ 미리보기에서는 제한됨 — 배포 후 정상 작동." },
    ],
    agents: [
      { q: "기본 에이전트 (5명, 자동 활성)", a: "🎯 회의 진행자: 논의 구조화, 결론 도출\n♟️ 전략가: 시장 분석, 전략 방향\n💡 크리에이터: 창의적 아이디어\n⚠️ 리스크 분석가: 리스크, 건설적 반론\n📋 실행 매니저: 액션 플랜, 일정, 우선순위" },
      { q: "추가 에이전트 (6명, 클릭 추가)", a: "📊 데이터분석가: 수치 근거, ROI, 지표 분석\n📢 마케터: 고객 분석, 채널 전략, 브랜딩\n💰 재무분석가: 매출 예측, 손익분기점, 현금흐름\n👨‍💻 개발자: 기술 스택, MVP, 바이브 코딩\n🎨 디자인 분석가: UX/UI, 사용자 경험\n🤝 영업 전문가: 고객 확보, 가격 정책, 파트너십" },
      { q: "에이전트 초대/퇴장", a: "데스크톱: 왼쪽 패널에서 클릭\n모바일: 상단 바에서 클릭\n\n밝으면 참여 중, 어두우면 미참여.\n클릭할 때마다 토글됩니다." },
      { q: "몇 명이 적당한가요?", a: "권장 5~6명.\n\n• 3명: 빠르지만 관점 부족\n• 5~6명: 균형 잡힌 토론 (추천)\n• 8명+: 풍부하지만 시간 오래 걸림\n• 11명 전부: 자동 수렴 시 3~5분 소요\n\n주제에 맞는 에이전트만 골라 쓰는 게 좋아요." },
    ],
    search: [
      { q: "웹 검색이 뭔가요?", a: "에이전트가 답변 시 인터넷에서 실시간 데이터를 검색합니다.\n예: 최신 시장 통계, 경쟁사 현황, 금리 정보, 분양률 등\n\n검색 없으면 LLM 학습 데이터로만 답변 (추측 가능)." },
      { q: "지원 모델", a: "✅ ✨ 내장 Claude: web_search 도구 자동 호출\n✅ 🟣 Claude (Anthropic): web_search 도구 자동 호출\n✅ 🔍 Perplexity: 모든 답변에 검색+출처 내장\n\n❌ Cerebras, Groq, OpenAI: 웹 검색 미지원" },
      { q: "언제 켜야 하나요?", a: "✅ 켜면 좋은 경우:\n• 시장 조사, 경쟁 분석\n• 최신 트렌드/통계 필요\n• 부동산, 금융 등 실시간 데이터\n\n❌ 꺼도 되는 경우:\n• 브레인스토밍\n• 내부 전략 논의\n• 창의적 아이디어 발산\n\n⚠️ 검색 ON하면 에이전트당 +5~10초 추가됩니다." },
      { q: "설정 방법", a: "⚙️ 버튼 → 🌐 웹 검색 모드 토글 ON\n\n내장 Claude 또는 Anthropic/Perplexity 선택 시 사용 가능." },
    ],
    report: [
      { q: "결론 리포트란?", a: "회의 토론 내용을 AI가 분석해서 자동으로 만드는 종합 보고서입니다.\n\n자동 수렴 모드에서는 3라운드 후 자동 생성되고,\n수동 모드에서는 /결론 또는 📊 버튼으로 생성합니다." },
      { q: "🎯 결론 탭", a: "합의된 사항, 다수 의견, 미해결 쟁점, 최종 결론, KPI가 정리됩니다." },
      { q: "🗺️ 실행 로드맵 탭", a: "3단계 이상의 실행 계획이 나옵니다.\n각 단계별로:\n• 구체적 할 일\n• 단계별 방법 (초보자도 따라할 수 있게)\n• 사용할 도구\n• 비용 / 소요 시간 / 난이도\n• 초보자 팁" },
      { q: "🛠️ 도구 & 예산 탭", a: "분야별 추천 도구 + 무료 대안\n최소 예산 vs 권장 예산\n항목별 비용 내역" },
      { q: "⚠️ 리스크 & KPI 탭", a: "각 리스크와 구체적 대응 방법\n숫자가 포함된 성공 지표 목표" },
      { q: "💻 개발 지침 탭 (자동)", a: "회의에서 '개발', '시스템', '앱', 'MVP' 등 키워드가 나오면 자동 추가됩니다.\n\n포함 내용:\n• 기술 스택 (프론트/백/DB/배포)\n• MVP 핵심 기능\n• 단계별 바이브 코딩 프롬프트\n• AI에게 복붙할 수 있는 프롬프트 예시\n• 노코드 대안\n• 예상 시간/비용" },
      { q: "💾 리포트 저장", a: "리포트 하단의 💾 버튼을 누르면 전체 내용이 텍스트 파일로 다운로드됩니다.\n회의록 + 결론 + 로드맵 + 도구 + 리스크 + 개발 지침까지 전부 포함." },
    ],
    speed: [
      { q: "왜 오래 걸리나요?", a: "에이전트가 순차적으로 하나씩 API를 호출합니다.\n에이전트 1명당 약 8~15초, 5명이면 40~75초.\n\n자동 수렴 3라운드 = 5명 기준 약 2~4분\n웹 검색 ON이면 에이전트당 +5~10초 추가." },
      { q: "빠르게 쓰는 방법", a: "1. 에이전트 3~5명만 켜기 (가장 효과 큼)\n2. 웹 검색 OFF\n3. 배포 후 Cerebras/Groq 사용 (3~5배 빠름)\n4. 수동 모드로 필요한 라운드만 진행" },
      { q: "배포하면 얼마나 빨라지나요?", a: "내장 Claude (미리보기): 에이전트 1명 10~15초\nVercel + Claude API: 에이전트 1명 5~8초\nVercel + Cerebras/Groq: 에이전트 1명 1~3초\n\nCerebras/Groq로 배포하면 5~10배 빨라집니다." },
      { q: "🔄 강제 초기화 버튼", a: "2분 이상 응답이 없으면 자동으로 나타납니다.\n\n• 기다리면: 진행 중인 작업 계속됨 (대부분 결국 완료됨)\n• 누르면: 모든 것 즉시 중단, 새 주제 입력 가능\n\n완전히 멈췄을 때만 사용하세요." },
      { q: "45초 타임아웃", a: "각 API 호출에 45초 제한이 있습니다.\n45초 내 응답이 없으면 해당 에이전트를 건너뛰고 다음으로 자동 진행합니다." },
      { q: "회의가 멈췄을 때", a: "1. 조금 더 기다리기 (API가 느린 경우 대부분 해결)\n2. 🔄 강제 초기화 버튼 누르기\n3. ← 뒤로가기 → 새 회의 시작\n4. 에이전트 수를 줄이고 다시 시도" },
    ],
    tips: [
      { q: "좋은 결과를 얻으려면?", a: "주제를 구체적으로 입력하세요.\n\n✗ '사업 아이디어'\n✓ '반려동물 구독 박스 서비스를 서울에서 시작하려고 해. 초기 자본 2000만원, 타겟은 2030대 1인 가구.'\n\n배경 정보가 많을수록 에이전트 답변이 정확합니다." },
      { q: "에이전트 조합 추천", a: "사업 기획: 진행자 + 전략가 + 재무분석가 + 리스크 + 실행매니저\n\n마케팅: 진행자 + 마케터 + 크리에이터 + 데이터분석가 + 영업\n\n개발: 진행자 + 개발자 + 디자이너 + 실행매니저 + 리스크\n\n투자: 진행자 + 재무분석가 + 전략가 + 데이터분석가 + 리스크" },
      { q: "결론 리포트 활용법", a: "• 🎯결론 탭: 핵심 합의사항 빠르게 확인\n• 🗺️로드맵 탭: 단계별 실행 계획 따라하기\n• 🛠️도구 탭: 필요한 도구와 예산 확인\n• ⚠️리스크 탭: 주의사항 미리 대비\n• 💻개발 탭: 바이브 코딩 프롬프트 복사\n• 💾저장: 텍스트 파일로 내보내서 공유" },
      { q: "활용 예시", a: "• 창업 아이디어 검증\n• 마케팅 캠페인 기획\n• 신제품 출시 전략\n• 분기 회고 및 개선점 도출\n• 투자 의사결정\n• 위기 대응 시뮬레이션\n• 시스템 개발 기획\n• 조직 개편 방향 논의" },
    ],
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeSlideIn 0.3s ease",
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "linear-gradient(160deg, #0f1829, #162038)",
        border: "1px solid #253344", borderRadius: 20, padding: 0,
        maxWidth: 640, width: isMobile ? "95%" : "92%", maxHeight: "88vh",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 14px", borderBottom: "1px solid #1a2838",
          background: "linear-gradient(135deg, #3b82f608, #8b5cf608)",
          borderRadius: "20px 20px 0 0", flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>❓ 도움말</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#546478", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "6px 12px", borderRadius: 8, border: "none", whiteSpace: "nowrap",
                background: tab === t.id ? "#1e3a5f" : "transparent",
                color: tab === t.id ? "#60a5fa" : "#546478",
                fontSize: 11.5, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer",
              }}>{t.icon} {t.label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px" }}>
          {(content[tab] || []).map((item, i) => (
            <div key={i} style={{ marginBottom: 16, animation: "fadeSlideIn 0.2s ease" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>{item.q}</div>
              <div style={{
                fontSize: 12.5, color: "#94a3b8", lineHeight: 1.7,
                padding: "10px 14px", background: "#0a0f1c", borderRadius: 10,
                whiteSpace: "pre-wrap", borderLeft: "3px solid #253344",
              }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== 메인 컴포넌트 =====
export default function MeetingRoomV3() {
  const [phase, setPhase] = useState("lobby");
  const [meetingMode, setMeetingMode] = useState("manual"); // manual | auto
  const [template, setTemplate] = useState(null);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [activeAgents, setActiveAgents] = useState(AGENTS.slice(0, 5).map((a) => a.id));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentStates, setAgentStates] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [roundCount, setRoundCount] = useState(0);
  const [error, setError] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [stuckSince, setStuckSince] = useState(null); // 멈춤 감지용
  const [showForceReset, setShowForceReset] = useState(false);

  // LLM 설정
  const [llmSettings, setLlmSettings] = useState(() => loadLLMSettings());
  const [showSettings, setShowSettings] = useState(false);
  const currentProvider = LLM_PROVIDERS.find((p) => p.id === llmSettings.providerId) || LLM_PROVIDERS[1];
  const currentModel = currentProvider.models.find((m) => m.id === llmSettings.modelId) || currentProvider.models[0];

  const updateLLM = (update) => {
    const next = { ...llmSettings, ...update };
    setLlmSettings(next);
    saveLLMSettings(next);
  };

  // 자동 수렴
  const [autoConverging, setAutoConverging] = useState(false);
  const [convergenceRound, setConvergenceRound] = useState(0);
  const [convergenceStatus, setConvergenceStatus] = useState("");
  const convergenceLabels = ["초기 의견", "토론 & 반박", "수렴 & 합의", "결론 도출"];

  // 결론 리포트
  const [conclusionData, setConclusionData] = useState(null);
  const [showConclusion, setShowConclusion] = useState(false);

  // 도움말
  const [showHelp, setShowHelp] = useState(false);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const abortRef = useRef(false);
  const sessionRef = useRef(0); // 세션 ID - 이전 회의 비동기 작업 무시용
  const isMobile = useIsMobile();
  const [showAgentPanel, setShowAgentPanel] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 처리 상태 변경 시 멈춤 타이머 관리
  useEffect(() => {
    if (isProcessing) {
      setStuckSince(Date.now());
      setShowForceReset(false);
      const timer = setTimeout(() => setShowForceReset(true), 120000);
      return () => clearTimeout(timer);
    } else {
      setStuckSince(null);
      setShowForceReset(false);
    }
  }, [isProcessing]);

  // 강제 초기화
  const forceReset = () => {
    sessionRef.current += 1;
    abortRef.current = true;
    cancelSpeech();
    setIsProcessing(false);
    setAutoConverging(false);
    setAgentStates({});
    setStuckSince(null);
    setShowForceReset(false);
    setError(null);
    addSystem("🔄 강제 초기화되었습니다. 새 주제를 입력하세요.");
    setTimeout(() => { abortRef.current = false; }, 200);
  };

  const toggleAgent = (id) => setActiveAgents((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const cancelSpeech = () => { try { window.speechSynthesis?.cancel(); } catch {} };

  const speakText = useCallback((text, agent) => {
    if (!ttsEnabled) return Promise.resolve();
    try {
      if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve();
    } catch { return Promise.resolve(); }
    return new Promise((r) => {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "ko-KR"; u.rate = 1.05;
        u.pitch = agent.id === "critic" ? 0.85 : agent.id === "creative" ? 1.12 : 1.0;
        u.onend = r; u.onerror = () => r();
        window.speechSynthesis.speak(u);
        setTimeout(() => { if (!window.speechSynthesis?.speaking) r(); }, 5000);
      } catch { r(); }
    });
  }, [ttsEnabled]);

  const addMsg = (msg) => setMessages((p) => [...p, msg]);
  const addSystem = (content, highlight = false) => addMsg({ role: "system", content, timestamp: getTimestamp(), highlight });
  const addNote = (text) => setMeetingNotes((p) => [...p, `[${getTimestamp()}] ${text}`]);

  // ===== 타임아웃 fetch (45초 제한) =====
  const fetchWithTimeout = (url, options, timeoutMs = 45000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
      .then(res => { clearTimeout(timer); return res; })
      .catch(err => {
        clearTimeout(timer);
        if (err.name === "AbortError") throw new Error("응답 시간 초과 (45초). 다시 시도해주세요.");
        throw err;
      });
  };

  // ===== LLM 호출 (다중 프로바이더 + 웹검색) =====
  const callLLM = async (agent, userMessage, history, extraSystem = "") => {
    if (currentProvider.id !== "builtin" && !llmSettings.apiKey) throw new Error("API 키를 설정해주세요. ⚙️ 버튼을 눌러 설정하세요.");

    const recent = history.slice(-14).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.role === "user" ? m.content : `[${AGENTS.find((a) => a.id === m.agent)?.name || "시스템"}]: ${m.content}`,
    }));
    const merged = [];
    for (const msg of recent) {
      if (merged.length > 0 && merged[merged.length - 1].role === msg.role) merged[merged.length - 1].content += "\n" + msg.content;
      else merged.push({ ...msg });
    }
    if (merged.length === 0 || merged[merged.length - 1].role !== "user") merged.push({ role: "user", content: userMessage });

    const searchInstruction = llmSettings.webSearch
      ? "\n\n중요: 답변 시 최신 데이터, 통계, 시장 현황이 필요하면 반드시 웹에서 검색해서 실제 데이터와 출처를 포함해. 추측이 아닌 사실 기반으로 답변해."
      : "";
    const sysPrompt = `${agent.systemPrompt}\n${extraSystem}\n\n중요: 다른 에이전트들의 이전 발언을 반드시 참고하고, 구체적으로 이름을 언급하며 동의/반박/보완해. 너의 이름은 "${agent.name}".${searchInstruction}`;

    // 서버 API (키 불필요)
    if (currentProvider.format === "server") {
      const body = { system: sysPrompt, messages: merged, max_tokens: 1500 };
      const res = await fetchWithTimeout("/api/meeting/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.error === "NO_SERVER_KEY") throw new Error("서버에 API 키가 설정되지 않았습니다. ⚙️에서 다른 제공자를 선택하거나 Vercel 환경변수를 설정하세요.");
      if (d.error) throw new Error(d.error);
      return d.text || "";
    }

    // Anthropic (API 키 사용)
    if (currentProvider.format === "anthropic") {
      const body = { model: currentModel.id, max_tokens: 1500, system: sysPrompt, messages: merged };
      if (llmSettings.webSearch) {
        body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }];
      }
      const res = await fetchWithTimeout(currentProvider.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": llmSettings.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `API ${res.status}`); }
      const d = await res.json();
      return d.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
    }
    
    // Perplexity (웹검색 내장)
    if (currentProvider.id === "perplexity") {
      const body = {
        model: currentModel.id, max_tokens: 1500,
        messages: [{ role: "system", content: sysPrompt }, ...merged],
        search_recency_filter: "month",
        return_citations: true,
      };
      const res = await fetchWithTimeout(currentProvider.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${llmSettings.apiKey}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `API ${res.status}`); }
      const d = await res.json();
      let reply = d.choices?.[0]?.message?.content || "";
      // 출처가 있으면 추가
      if (d.citations && d.citations.length > 0) {
        reply += "\n\n📎 출처: " + d.citations.slice(0, 3).join(", ");
      }
      return reply;
    }
    
    // 기타 OpenAI 호환 (Cerebras, Groq, OpenAI)
    else {
      const res = await fetchWithTimeout(currentProvider.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${llmSettings.apiKey}` },
        body: JSON.stringify({ model: currentModel.id, max_tokens: 1500, messages: [{ role: "system", content: sysPrompt }, ...merged] }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `API ${res.status}`); }
      const d = await res.json();
      return d.choices?.[0]?.message?.content || "";
    }
  };

  // ===== 한 라운드 실행 (모든 에이전트가 순서대로 발언) =====
  const runOneRound = async (prompt, allMsgs, roundNum, extraSystem = "") => {
    const currentSession = sessionRef.current;
    const active = activeAgents.map((id) => AGENTS.find((a) => a.id === id)).filter(Boolean);
    let msgs = [...allMsgs];

    for (const agent of active) {
      if (abortRef.current || sessionRef.current !== currentSession) break;
      setAgentStates((p) => ({ ...p, [agent.id]: "thinking" }));
      try {
        const reply = await callLLM(agent, prompt, msgs, extraSystem);
        if (sessionRef.current !== currentSession) break; // 세션 바뀌면 결과 버림
        const agentMsg = { role: "assistant", agent: agent.id, content: reply, timestamp: getTimestamp(), round: roundNum };
        msgs = [...msgs, agentMsg];
        addMsg(agentMsg);
        addNote(`${agent.emoji} ${agent.name} (R${roundNum}): ${reply}`);
        setAgentStates((p) => ({ ...p, [agent.id]: "speaking" }));
        await speakText(reply, agent);
      } catch (err) {
        if (sessionRef.current !== currentSession) break;
        setError(`${agent.name}: ${err.message}`);
      }
      if (sessionRef.current === currentSession) {
        setAgentStates((p) => ({ ...p, [agent.id]: "idle" }));
      }
    }
    return msgs;
  };

  // ===== 결론 생성 API =====
  // ===== 범용 LLM 호출 (시스템 + 유저 메시지) =====
  const callLLMRaw = async (sysPrompt, messages, maxTokens = 4000) => {
    if (currentProvider.id !== "builtin" && !llmSettings.apiKey) throw new Error("API 키를 설정해주세요.");
    
    // 서버 API
    if (currentProvider.format === "server") {
      const res = await fetchWithTimeout("/api/meeting/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sysPrompt, messages, max_tokens: maxTokens }),
      });
      const d = await res.json();
      if (d.error === "NO_SERVER_KEY") throw new Error("서버 API 키 미설정");
      if (d.error) throw new Error(d.error);
      return d.text || "";
    }
    // Anthropic
    if (currentProvider.format === "anthropic") {
      const body = { model: currentModel.id, max_tokens: maxTokens, system: sysPrompt, messages };
      if (llmSettings.webSearch) body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }];
      const res = await fetchWithTimeout(currentProvider.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": llmSettings.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `API ${res.status}`); }
      const d = await res.json();
      return d.content.filter((c) => c.type === "text").map((c) => c.text).join("");
    } else if (currentProvider.id === "perplexity") {
      const res = await fetchWithTimeout(currentProvider.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${llmSettings.apiKey}` },
        body: JSON.stringify({ model: currentModel.id, max_tokens: maxTokens, messages: [{ role: "system", content: sysPrompt }, ...messages], search_recency_filter: "month" }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `API ${res.status}`); }
      const d = await res.json();
      return d.choices?.[0]?.message?.content || "";
    } else {
      const res = await fetchWithTimeout(currentProvider.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${llmSettings.apiKey}` },
        body: JSON.stringify({ model: currentModel.id, max_tokens: maxTokens, messages: [{ role: "system", content: sysPrompt }, ...messages] }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `API ${res.status}`); }
      const d = await res.json();
      return d.choices?.[0]?.message?.content || "";
    }
  };

  // ===== JSON 안전 파싱 (잘린 JSON 복구) =====
  const safeParseJSON = (text) => {
    let cleaned = text.replace(/```json|```/g, "").trim();
    // 첫 번째 { 부터 시작
    const startIdx = cleaned.indexOf("{");
    if (startIdx > 0) cleaned = cleaned.slice(startIdx);
    
    try { return JSON.parse(cleaned); } catch {}

    // 잘린 JSON 복구 시도: 열린 괄호 닫기
    let fixed = cleaned;
    let openBraces = 0, openBrackets = 0, inString = false, escaped = false;
    for (let i = 0; i < fixed.length; i++) {
      const c = fixed[i];
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c === "{") openBraces++;
      if (c === "}") openBraces--;
      if (c === "[") openBrackets++;
      if (c === "]") openBrackets--;
    }
    // 문자열이 열려있으면 닫기
    if (inString) fixed += '"';
    while (openBrackets > 0) { fixed += "]"; openBrackets--; }
    while (openBraces > 0) { fixed += "}"; openBraces--; }
    
    try { return JSON.parse(fixed); } catch {}

    // 마지막 시도: 불완전한 끝부분 잘라내고 닫기
    const lastGoodComma = fixed.lastIndexOf(",");
    if (lastGoodComma > 0) {
      let truncated = fixed.slice(0, lastGoodComma);
      openBraces = 0; openBrackets = 0; inString = false; escaped = false;
      for (let i = 0; i < truncated.length; i++) {
        const c = truncated[i];
        if (escaped) { escaped = false; continue; }
        if (c === "\\") { escaped = true; continue; }
        if (c === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (c === "{") openBraces++;
        if (c === "}") openBraces--;
        if (c === "[") openBrackets++;
        if (c === "]") openBrackets--;
      }
      if (inString) truncated += '"';
      while (openBrackets > 0) { truncated += "]"; openBrackets--; }
      while (openBraces > 0) { truncated += "}"; openBraces--; }
      try { return JSON.parse(truncated); } catch {}
    }
    
    return null;
  };

  // ===== 결론 생성 (2단계 분리) =====
  // ===== 결론 전용 API 호출 (웹검색 없이, 간결하게) =====
  const callForConclusion = async (sysPrompt, userContent, maxTokens = 2500) => {
    // 서버 API
    if (currentProvider.format === "server") {
      const res = await fetchWithTimeout("/api/meeting/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sysPrompt, messages: [{ role: "user", content: userContent }], max_tokens: maxTokens }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      return d.text || "";
    }
    // Anthropic
    if (currentProvider.format === "anthropic") {
      const res = await fetchWithTimeout(currentProvider.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": llmSettings.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: currentModel.id, max_tokens: maxTokens, system: sysPrompt, messages: [{ role: "user", content: userContent }] }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `API ${res.status}`); }
      const d = await res.json();
      return d.content.filter((c) => c.type === "text").map((c) => c.text).join("");
    } else {
      const url = currentProvider.apiUrl;
      const headers = { "Content-Type": "application/json" };
      if (llmSettings.apiKey) headers["Authorization"] = `Bearer ${llmSettings.apiKey}`;
      const res = await fetchWithTimeout(url, {
        method: "POST", headers,
        body: JSON.stringify({ model: currentModel.id, max_tokens: maxTokens, messages: [{ role: "system", content: sysPrompt }, { role: "user", content: userContent }] }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `API ${res.status}`); }
      const d = await res.json();
      return d.choices?.[0]?.message?.content || "";
    }
  };

  const generateConclusion = async (allMsgs) => {
    // 대화 내용 요약 (최대 3000자로 제한하여 서버 오류 방지)
    const rawContent = allMsgs.filter((m) => m.role !== "system").map((m) =>
      m.role === "user" ? `[사용자]: ${m.content}` : `[${AGENTS.find((a) => a.id === m.agent)?.name}${m.round ? ` R${m.round}` : ""}]: ${m.content}`
    ).join("\n");
    const content = rawContent.length > 3000 ? rawContent.slice(0, 1500) + "\n...(중략)...\n" + rawContent.slice(-1500) : rawContent;

    // 1단계: 결론 + 로드맵
    const sysPrompt1 = `회의 결론 도출 전문가. 아래 JSON 형식으로만 답변. JSON 외 텍스트 없이. 완전한 JSON 필수.
{"title":"주제 요약","consensus":["전원 동의"],"majority":["다수 동의"],"unresolved":["미해결"],"finalConclusion":"결론 3-5문장","executionRoadmap":[{"phase":"단계명","period":"기간","goal":"목표","tasks":[{"task":"할일","howTo":"방법","tools":["도구"],"cost":"비용","duration":"시간","difficulty":"쉬움","tip":"팁"}]}]}
규칙: 3단계, 각 tasks 2개, howTo는 구체적으로`;

    let result = null;

    // 시도 1
    try {
      const text1 = await callForConclusion(sysPrompt1, `회의 결론 도출:\n${content}`, 2500);
      result = safeParseJSON(text1);
    } catch (err) {
      console.log("결론 1차 시도 실패:", err.message);
    }
    
    // 시도 2: 더 짧게
    if (!result) {
      try {
        const shortContent = rawContent.length > 1500 ? rawContent.slice(0, 800) + "\n...\n" + rawContent.slice(-700) : rawContent;
        const text2 = await callForConclusion(
          `회의 결론을 JSON으로만 답변. {"title":"주제","consensus":["합의"],"majority":["다수"],"unresolved":["미해결"],"finalConclusion":"결론","executionRoadmap":[{"phase":"1단계","period":"1-2주","goal":"목표","tasks":[{"task":"할일","howTo":"방법","tools":["도구"],"cost":"비용","duration":"시간","difficulty":"쉬움","tip":"팁"}]}]}`,
          shortContent, 2000
        );
        result = safeParseJSON(text2);
      } catch (err) {
        console.log("결론 2차 시도 실패:", err.message);
      }
    }

    // 시도 3: 최소 형태
    if (!result) {
      try {
        const miniContent = rawContent.slice(0, 500);
        const text3 = await callForConclusion(
          `회의 요약을 JSON으로. {"title":"주제","finalConclusion":"결론 요약","consensus":["합의사항"],"executionRoadmap":[]}`,
          miniContent, 1000
        );
        result = safeParseJSON(text3);
      } catch (err) {
        console.log("결론 3차 시도 실패:", err.message);
      }
    }

    if (!result) {
      result = { title: "회의 결론", consensus: [], majority: [], unresolved: [], finalConclusion: "결론 생성에 실패했습니다. ✕를 닫고 /결론 을 다시 입력해 보세요.", executionRoadmap: [] };
    }

    // 2단계: 도구/예산/리스크 (실패해도 무시)
    try {
      const text2 = await callForConclusion(
        `실행 정보를 JSON으로. {"techStack":[{"category":"분야","recommended":"도구","free":"무료","reason":"이유"}],"budget":{"minimum":"최소","recommended":"권장","breakdown":["내역"]},"risks":[{"risk":"리스크","prevention":"대응"}],"kpi":["목표"],"resources":["자료"]}`,
        `주제: ${result.title}\n결론: ${result.finalConclusion}`, 1500
      );
      const extra = safeParseJSON(text2);
      if (extra) {
        if (extra.techStack) result.techStack = extra.techStack;
        if (extra.budget) result.budget = extra.budget;
        if (extra.risks) result.risks = extra.risks;
        if (extra.kpi) result.kpi = extra.kpi;
        if (extra.resources) result.resources = extra.resources;
      }
    } catch (err) {
      console.log("2단계 스킵:", err.message);
    }

    // 3단계: 개발이 필요한지 감지 → 바이브 코딩 개발 지침 자동 생성
    const devKeywords = ["개발", "시스템", "앱", "웹사이트", "플랫폼", "서비스", "API", "자동화", "봇", "대시보드", "MVP", "프로토타입", "SaaS", "솔루션", "기능 구현", "소프트웨어"];
    const needsDev = devKeywords.some((kw) => rawContent.includes(kw) || (result.finalConclusion || "").includes(kw) || (result.title || "").includes(kw));

    if (needsDev) {
      try {
        const devText = await callForConclusion(
          `너는 시니어 풀스택 개발자이자 바이브 코딩 전문가야. 프로젝트에 필요한 개발 지침서를 JSON으로 작성해. JSON만 출력.
{"devGuide":{"summary":"어떤 시스템을 만들어야 하는지 한 줄 설명","architecture":"전체 시스템 구조 설명 (프론트/백/DB/외부API 등 2-3문장)","techStack":{"frontend":"프레임워크 (예: Next.js + Tailwind)","backend":"서버 (예: Next.js API Routes 또는 Supabase)","database":"DB (예: Supabase PostgreSQL)","hosting":"배포 (예: Vercel)","etc":"기타 필요한 서비스"},"mvpFeatures":["MVP에 반드시 포함할 핵심 기능 (3-5개)"],"devPhases":[{"phase":"1단계: 기초 세팅","period":"1-3일","tasks":["구체적 개발 작업"],"vibePrompt":"이 단계를 바이브 코딩으로 할 때 AI에게 줄 프롬프트 예시"},{"phase":"2단계","period":"기간","tasks":["작업"],"vibePrompt":"프롬프트 예시"}],"vibeGuide":{"tool":"추천 바이브 코딩 도구 (예: Claude, Cursor, Bolt 등)","tips":["바이브 코딩 시 주의사항/팁 (3-4개)"],"samplePrompts":["실제 사용할 수 있는 프롬프트 예시 3개 (구체적으로)"]},"noCodeAlternative":"코딩 없이 할 수 있는 대안 (노코드 도구 이름 + 방법)","estimatedTime":"개발 예상 총 소요 시간","estimatedCost":"개발 비용 (직접 vs 외주 vs 바이브코딩)"}}
규칙: vibePrompt와 samplePrompts는 실제로 AI에게 복붙해서 쓸 수 있을 정도로 구체적으로. 프론트엔드/백엔드 기술은 초보자도 쓸 수 있는 걸로 추천.`,
          `프로젝트: ${result.title}\n결론: ${result.finalConclusion}\n로드맵: ${JSON.stringify((result.executionRoadmap || []).map(r => r.phase + ": " + r.goal))}`,
          2500
        );
        const devData = safeParseJSON(devText);
        if (devData?.devGuide) result.devGuide = devData.devGuide;
      } catch (err) {
        console.log("3단계 개발 지침 스킵:", err.message);
      }
    }

    return result;
  };

  // ===== 자동 수렴 모드 실행 =====
  const runAutoConvergence = async (topic) => {
    const currentSession = sessionRef.current;
    setAutoConverging(true);
    setIsProcessing(true);
    abortRef.current = false;

    let allMsgs = [...messages];

    // === 라운드 1: 초기 의견 ===
    setConvergenceRound(0);
    setConvergenceStatus("각 에이전트가 초기 의견을 제시하고 있습니다...");
    addSystem("🔄 [자동 수렴] 라운드 1: 초기 의견 수집", true);

    allMsgs = await runOneRound(
      topic, allMsgs, 1,
      "이것은 첫 번째 라운드야. 주제에 대해 너의 관점에서 솔직한 초기 의견과 입장을 밝혀줘. 찬성/반대/조건부 찬성 등 입장을 명확히 해."
    );

    if (abortRef.current || sessionRef.current !== currentSession) { cleanup(); return; }
    setRoundCount(1);

    // === 라운드 2: 토론 & 반박 ===
    setConvergenceRound(1);
    setConvergenceStatus("에이전트들이 서로 의견을 반박하고 보완합니다...");
    addSystem("🔥 [자동 수렴] 라운드 2: 토론 & 상호 반박", true);

    allMsgs = await runOneRound(
      "이전 라운드의 다른 에이전트 의견을 검토하고, 구체적으로 이름을 언급하며 동의/반박/보완해주세요. 네 입장이 바뀌었다면 왜 바뀌었는지도 설명해.",
      allMsgs, 2,
      "이것은 토론 라운드야. 반드시 다른 에이전트의 이름을 직접 언급하며 동의하거나 반박해. 예: '전략가의 의견에 동의하지만, 리스크 분석가가 지적한 부분도 고려해야 합니다.' 새로운 관점이 있다면 추가해."
    );

    if (abortRef.current || sessionRef.current !== currentSession) { cleanup(); return; }
    setRoundCount(2);

    // === 라운드 3: 수렴 & 합의 시도 ===
    setConvergenceRound(2);
    setConvergenceStatus("합의점을 찾고 있습니다...");
    addSystem("🤝 [자동 수렴] 라운드 3: 수렴 & 합의 도출", true);

    allMsgs = await runOneRound(
      "2라운드의 토론을 바탕으로, 합의할 수 있는 부분은 합의하고, 양보할 부분은 양보해주세요. 최종 입장을 정리해주세요.",
      allMsgs, 3,
      "이것은 수렴 라운드야. 2라운드 토론을 통해 생각이 바뀐 부분이 있으면 솔직히 밝혀. '처음엔 반대했지만, [에이전트]의 의견을 듣고 조건부 찬성으로 바꿉니다'처럼. 합의 가능한 공통분모를 적극 찾되, 진짜 양보 못하는 부분은 명확히 해."
    );

    if (abortRef.current || sessionRef.current !== currentSession) { cleanup(); return; }
    setRoundCount(3);

    // === 라운드 4: 결론 도출 ===
    setConvergenceRound(3);
    setConvergenceStatus("최종 결론을 정리하고 있습니다...");
    addSystem("📊 [자동 수렴] 최종 결론 도출 중...", true);

    try {
      const conclusion = await generateConclusion(allMsgs);
      setConclusionData(conclusion);
      setShowConclusion(true);
      addSystem("✅ 최종 결론이 도출되었습니다!", true);
      addNote("═══ 최종 결론 도출 완료 ═══");
    } catch (err) {
      console.error("Conclusion error:", err);
      setError("결론 도출 중 오류: " + err.message);
    }

    cleanup();
  };

  const cleanup = () => {
    setAutoConverging(false);
    setIsProcessing(false);
    setAgentStates({});
    abortRef.current = false;
  };

  const stopAutoConvergence = () => {
    abortRef.current = true;
    cancelSpeech();
    setIsProcessing(false);
    setAutoConverging(false);
    setAgentStates({});
    addSystem("⏹ 자동 수렴이 중단되었습니다.");
  };

  // ===== 수동 모드 전송 =====
  const handleSend = async (overrideInput) => {
    const text = overrideInput || input.trim();
    if (!text || isProcessing) return;
    const currentSession = sessionRef.current;

    if (text === "/요약" || text === "/결론") {
      addSystem("📊 결론을 도출하고 있습니다...", true);
      setIsProcessing(true);
      try {
        const conclusion = await generateConclusion(messages);
        if (sessionRef.current === currentSession) {
          setConclusionData(conclusion);
          setShowConclusion(true);
        }
      } catch (e) { if (sessionRef.current === currentSession) setError("결론 생성 오류: " + e.message); }
      if (sessionRef.current === currentSession) setIsProcessing(false);
      setInput("");
      return;
    }

    const userMsg = { role: "user", content: text, timestamp: getTimestamp() };
    addMsg(userMsg);
    setInput("");

    if (meetingMode === "auto") {
      await runAutoConvergence(text);
    } else {
      setIsProcessing(true);
      setError(null);
      const allMsgs = await runOneRound(text, [...messages, userMsg], roundCount + 1);
      if (sessionRef.current === currentSession) {
        setRoundCount((p) => p + 1);
        setIsProcessing(false);
      }
    }
  };

  // 수동 토론 라운드
  const triggerDebate = async () => {
    if (isProcessing || messages.length < 2) return;
    const currentSession = sessionRef.current;
    setIsProcessing(true);
    addSystem("🔥 토론 라운드 시작", true);
    await runOneRound(
      "다른 에이전트들의 의견을 검토하고, 이름을 직접 언급하며 동의/반박/보완해주세요.",
      messages, roundCount + 1,
      "토론 라운드. 반드시 다른 에이전트 이름을 언급하며 대응해."
    );
    setRoundCount((p) => p + 1);
    setIsProcessing(false);
  };

  // STT
  const toggleVoice = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("음성 인식 미지원 브라우저입니다. Chrome에서 사용해주세요."); return; }
    try {
      const r = new SR(); r.lang = "ko-KR"; r.continuous = false;
      r.onresult = (e) => { setInput(e.results[0][0].transcript); setIsListening(false); };
      r.onerror = (e) => {
        setIsListening(false);
        if (e.error === "not-allowed") setError("🎙️ 마이크 권한이 필요합니다. 배포 후 HTTPS 환경에서 사용하세요.");
        else if (e.error === "network") setError("🎙️ 네트워크 오류. 인터넷 연결을 확인해주세요.");
      };
      r.onend = () => setIsListening(false);
      recognitionRef.current = r; r.start(); setIsListening(true);
    } catch (err) {
      setError("🎙️ 음성 입력은 미리보기에서 제한됩니다. 배포 후 사용 가능합니다.");
    }
  };

  // 리포트 내보내기
  const exportReport = () => {
    const d = conclusionData;
    const names = activeAgents.map((id) => AGENTS.find((a) => a.id === id)?.name).join(", ");
    let text = `📊 DD Ai 에이전트 회의 최종 리포트 & 실행 가이드\n${"═".repeat(55)}\n`;
    text += `📅 ${new Date().toLocaleDateString("ko-KR")} ${new Date().toLocaleTimeString("ko-KR")}\n`;
    text += `📌 유형: ${template?.name || "자유 회의"} | 모드: ${meetingMode === "auto" ? "자동 수렴" : "수동"}\n`;
    text += `👥 참여: ${names}\n🔄 라운드: ${roundCount}회\n${"═".repeat(55)}\n\n`;

    if (d) {
      text += `🎯 ${d.title || "회의 결론"}\n\n`;
      if (d.consensus?.length) text += `✅ 합의된 사항:\n${d.consensus.map((x,i) => `  ${i+1}. ${x}`).join("\n")}\n\n`;
      if (d.majority?.length) text += `▸ 다수 의견:\n${d.majority.map((x,i) => `  ${i+1}. ${x}`).join("\n")}\n\n`;
      if (d.unresolved?.length) text += `⚠️ 미해결 쟁점:\n${d.unresolved.map((x,i) => `  ${i+1}. ${x}`).join("\n")}\n\n`;
      if (d.finalConclusion) text += `🎯 최종 결론:\n${d.finalConclusion}\n\n`;

      // 실행 로드맵
      if (d.executionRoadmap?.length) {
        text += `${"─".repeat(55)}\n🗺️ 실행 로드맵\n${"─".repeat(55)}\n\n`;
        d.executionRoadmap.forEach((phase) => {
          text += `【${phase.phase}】 ${phase.period}\n`;
          text += `  목표: ${phase.goal}\n\n`;
          (phase.tasks || []).forEach((task, ti) => {
            text += `  ${ti+1}. ${task.task}\n`;
            text += `     난이도: ${task.difficulty} | 소요: ${task.duration} | 비용: ${task.cost}\n`;
            text += `     방법: ${task.howTo}\n`;
            if (task.tools?.length) text += `     도구: ${task.tools.join(", ")}\n`;
            if (task.tip) text += `     💡 Tip: ${task.tip}\n`;
            text += `\n`;
          });
        });
      }

      // 도구 & 기술
      if (d.techStack?.length) {
        text += `${"─".repeat(55)}\n🛠️ 추천 도구 & 기술\n${"─".repeat(55)}\n\n`;
        d.techStack.forEach((tech) => {
          text += `  [${tech.category}]\n`;
          text += `    추천: ${tech.recommended}\n`;
          if (tech.free) text += `    무료 대안: ${tech.free}\n`;
          if (tech.reason) text += `    이유: ${tech.reason}\n`;
          text += `\n`;
        });
      }

      // 예산
      if (d.budget) {
        text += `${"─".repeat(55)}\n💰 예산 가이드\n${"─".repeat(55)}\n\n`;
        text += `  최소: ${d.budget.minimum}\n  권장: ${d.budget.recommended}\n`;
        if (d.budget.breakdown?.length) {
          text += `  세부:\n${d.budget.breakdown.map(b => `    · ${b}`).join("\n")}\n`;
        }
        text += `\n`;
      }

      // 리스크
      if (d.risks?.length) {
        text += `${"─".repeat(55)}\n⚠️ 리스크 & 대응\n${"─".repeat(55)}\n\n`;
        d.risks.forEach((r, i) => {
          text += `  ${i+1}. 리스크: ${r.risk}\n     대응: ${r.prevention}\n\n`;
        });
      }

      // KPI
      if (d.kpi?.length) {
        text += `${"─".repeat(55)}\n📈 성공 지표 (KPI)\n${"─".repeat(55)}\n\n`;
        d.kpi.forEach((k, i) => { text += `  ${i+1}. ${k}\n`; });
        text += `\n`;
      }

      // 리소스
      if (d.resources?.length) {
        text += `${"─".repeat(55)}\n📚 참고 리소스\n${"─".repeat(55)}\n\n`;
        d.resources.forEach((r, i) => { text += `  ${i+1}. ${r}\n`; });
        text += `\n`;
      }

      // 개발 지침
      if (d.devGuide) {
        const dg = d.devGuide;
        text += `${"─".repeat(55)}\n💻 개발 지침서 (바이브 코딩 가이드)\n${"─".repeat(55)}\n\n`;
        if (dg.summary) text += `📌 ${dg.summary}\n`;
        if (dg.architecture) text += `🏗️ 아키텍처: ${dg.architecture}\n\n`;
        if (dg.techStack) {
          text += `🛠️ 기술 스택:\n`;
          Object.entries(dg.techStack).forEach(([k, v]) => { if (v) text += `  ${k}: ${v}\n`; });
          text += `\n`;
        }
        if (dg.mvpFeatures?.length) {
          text += `🎯 MVP 기능:\n${dg.mvpFeatures.map((f, i) => `  ${i+1}. ${f}`).join("\n")}\n\n`;
        }
        if (dg.devPhases?.length) {
          text += `📅 개발 단계:\n`;
          dg.devPhases.forEach((p) => {
            text += `\n  【${p.phase}】 ${p.period}\n`;
            p.tasks?.forEach((t) => { text += `    • ${t}\n`; });
            if (p.vibePrompt) text += `    🪄 프롬프트: ${p.vibePrompt}\n`;
          });
          text += `\n`;
        }
        if (dg.vibeGuide?.samplePrompts?.length) {
          text += `🪄 바이브 코딩 프롬프트 모음:\n`;
          dg.vibeGuide.samplePrompts.forEach((p, i) => { text += `  ${i+1}. ${p}\n`; });
          text += `\n`;
        }
        if (dg.noCodeAlternative) text += `🧩 노코드 대안: ${dg.noCodeAlternative}\n`;
        if (dg.estimatedTime) text += `⏱ 예상 시간: ${dg.estimatedTime}\n`;
        if (dg.estimatedCost) text += `💰 예상 비용: ${dg.estimatedCost}\n\n`;
      }
    }

    text += `\n${"═".repeat(55)}\n📝 전체 회의록\n${"─".repeat(55)}\n${meetingNotes.join("\n")}\n`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `meeting-report-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  // ===== 회의 시작 =====
  const startMeeting = (tmpl, mode) => {
    try {
      // 이전 회의 완전 종료
      sessionRef.current += 1; // 세션 변경 → 이전 비동기 작업 모두 무시됨
      abortRef.current = true;
      cancelSpeech();

      // 상태 전체 초기화
      setIsProcessing(false);
      setAgentStates({});
      setAutoConverging(false);
      setError(null);
      setConclusionData(null);
      setShowConclusion(false);
      setMessages([]);
      setMeetingNotes([]);
      setRoundCount(0);
      setCurrentPhaseIdx(0);

      // 새 회의 설정
      setTemplate(tmpl);
      setMeetingMode(mode);
      setPhase("meeting");

      // abort 해제 (약간의 지연으로 이전 비동기 정리 시간 확보)
      setTimeout(() => { abortRef.current = false; }, 200);

      const modeLabel = mode === "auto" ? "자동 수렴" : "수동 진행";
      // addSystem을 setTimeout으로 분리해서 messages 초기화 이후 실행 보장
      setTimeout(() => {
        setMessages([{ role: "system", content: `${tmpl?.icon || "💬"} "${tmpl?.name || "자유 회의"}" 시작 · ${modeLabel} 모드`, timestamp: getTimestamp(), highlight: false }]);
      }, 50);
    } catch (err) {
      console.error("startMeeting error:", err);
      setPhase("meeting");
    }
  };

  // ===== LOBBY =====
  if (phase === "lobby") {
    return (
      <div style={{
        width: "100%", height: "100vh", overflow: "auto",
        background: "linear-gradient(165deg, #080d19 0%, #0f1729 40%, #111b2e 100%)",
        fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
        color: "#e2e8f0", position: "relative",
      }}>
        <style>{globalStyles}</style>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "10%", left: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #3b82f605 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #8b5cf605 0%, transparent 70%)" }} />
        </div>

        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px", position: "relative", zIndex: 5 }}>
          {/* Hero */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16, filter: "drop-shadow(0 0 30px #3b82f633)" }}>🏛️</div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #e2e8f0, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>DD Ai 에이전트</h1>
            <p style={{ fontSize: 14, color: "#546478", marginTop: 8 }}>전문 AI 에이전트 팀이 당신의 의사결정을 돕습니다</p>
            <button onClick={() => setShowSettings(true)} style={{
              marginTop: 12, padding: "6px 16px", borderRadius: 8,
              border: "1px solid #253344", 
              background: (currentProvider.id === "builtin" || llmSettings.apiKey) ? "#34d39910" : "#f8717110",
              color: (currentProvider.id === "builtin" || llmSettings.apiKey) ? "#34d399" : "#f87171",
              fontSize: 12, cursor: "pointer", transition: "all 0.2s",
            }}>
              ⚙️ {currentProvider.icon} {currentProvider.name} · {currentModel.name}
              {currentProvider.id !== "builtin" && !llmSettings.apiKey && " (API 키 필요)"}
            </button>
            <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "center", alignItems: "center" }}>
              <button onClick={() => setShowHelp(true)} style={{
                padding: "5px 14px", borderRadius: 8, border: "1px solid #253344",
                background: "transparent", color: "#60a5fa", fontSize: 12, cursor: "pointer",
              }}>❓ 도움말</button>
            </div>
          </div>

          {/* 모드 선택 */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#546478", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>회의 모드 선택</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* 수동 모드 */}
              <div style={{
                padding: "24px 20px", borderRadius: 16,
                background: meetingMode === "manual" ? "linear-gradient(145deg, #1e3a5f20, #182538)" : "linear-gradient(145deg, #141e30, #182538)",
                border: meetingMode === "manual" ? "2px solid #3b82f6" : "1px solid #253344",
                cursor: "pointer", transition: "all 0.3s",
              }}
              onClick={() => setMeetingMode("manual")}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>🎮</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>수동 진행</div>
                <div style={{ fontSize: 11.5, color: "#7a8a9e", lineHeight: 1.6 }}>
                  직접 토론 타이밍을 컨트롤하며<br />대화 방향을 이끌어가는 모드
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                  {["질문 → 답변", "토론 버튼", "원하는 때 결론"].map((t) => (
                    <span key={t} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 8, background: "#0d1520", color: "#546478" }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* 자동 수렴 */}
              <div style={{
                padding: "24px 20px", borderRadius: 16,
                background: meetingMode === "auto" ? "linear-gradient(145deg, #34d39915, #182538)" : "linear-gradient(145deg, #141e30, #182538)",
                border: meetingMode === "auto" ? "2px solid #34d399" : "1px solid #253344",
                cursor: "pointer", transition: "all 0.3s", position: "relative", overflow: "hidden",
              }}
              onClick={() => setMeetingMode("auto")}
              >
                {meetingMode === "auto" && <div style={{
                  position: "absolute", top: 10, right: 10, fontSize: 9, padding: "3px 8px",
                  borderRadius: 8, background: "#34d39920", color: "#34d399", fontWeight: 600,
                }}>추천</div>}
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔄</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>자동 수렴</div>
                <div style={{ fontSize: 11.5, color: "#7a8a9e", lineHeight: 1.6 }}>
                  주제만 던지면 에이전트끼리<br />3라운드 토론 후 결론 자동 도출
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                  {["초기 의견", "토론", "수렴", "결론"].map((t) => (
                    <span key={t} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 8, background: "#0d1520", color: "#546478" }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 회의 템플릿 */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#546478", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>회의 유형</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {MEETING_TEMPLATES.map((tmpl) => (
                <button key={tmpl.id} onClick={() => startMeeting(tmpl, meetingMode)} style={{
                  padding: "20px 16px", borderRadius: 14,
                  background: "linear-gradient(145deg, #141e30, #182538)",
                  border: "1px solid #253344", cursor: "pointer", textAlign: "left", transition: "all 0.3s",
                  display: "flex", flexDirection: "column", gap: 8,
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "#253344"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <span style={{ fontSize: 28 }}>{tmpl.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{tmpl.name}</span>
                  <span style={{ fontSize: 11, color: "#546478", lineHeight: 1.4 }}>{tmpl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 자유 회의 */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <button onClick={() => startMeeting(null, meetingMode)} style={{
              padding: "12px 32px", borderRadius: 12, border: "1px solid #334155",
              background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer",
            }}
            onMouseOver={e => { e.target.style.borderColor = "#60a5fa"; e.target.style.color = "#60a5fa"; }}
            onMouseOut={e => { e.target.style.borderColor = "#334155"; e.target.style.color = "#94a3b8"; }}
            >자유 회의로 시작 →</button>
          </div>

          {/* 에이전트 */}
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#546478", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>참여 에이전트</h2>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
              {AGENTS.map((a) => <AgentAvatar key={a.id} agent={a} state="idle" isActive={activeAgents.includes(a.id)} onClick={() => toggleAgent(a.id)} />)}
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: "#3a4458", marginTop: 12 }}>클릭하여 초대/제외</p>
          </div>

          {/* LLM 설정 모달 */}
          {showSettings && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeSlideIn 0.3s ease" }}
              onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
              <div style={{ background: "linear-gradient(160deg, #0f1829, #162038)", border: "1px solid #253344", borderRadius: 20, padding: 28, maxWidth: 520, width: "92%", maxHeight: "85vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>⚙️ LLM 모델 설정</h2>
                  <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", color: "#546478", fontSize: 20, cursor: "pointer" }}>✕</button>
                </div>

                {/* 제공자 선택 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#7a8a9e", marginBottom: 8 }}>AI 제공자</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {LLM_PROVIDERS.map((p) => (
                      <button key={p.id} onClick={() => updateLLM({ providerId: p.id, modelId: p.models[0].id })} style={{
                        padding: "12px 14px", borderRadius: 12, textAlign: "left",
                        background: llmSettings.providerId === p.id ? "#1e3a5f20" : "#0a0f1c",
                        border: `2px solid ${llmSettings.providerId === p.id ? "#3b82f6" : "#1a2838"}`,
                        cursor: "pointer", transition: "all 0.2s",
                      }}>
                        <div style={{ fontSize: 14, marginBottom: 4 }}>{p.icon} <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{p.name}</span></div>
                        <div style={{ fontSize: 10, color: p.free ? "#34d399" : "#fbbf24" }}>{p.cost}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 모델 선택 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#7a8a9e", marginBottom: 8 }}>모델</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {currentProvider.models.map((m) => (
                      <button key={m.id} onClick={() => updateLLM({ modelId: m.id })} style={{
                        padding: "10px 14px", borderRadius: 10, textAlign: "left",
                        background: llmSettings.modelId === m.id ? "#1e3a5f20" : "#0a0f1c",
                        border: `1px solid ${llmSettings.modelId === m.id ? "#3b82f6" : "#1a2838"}`,
                        cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: "#546478" }}>{m.desc}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#0d1520", color: "#60a5fa" }}>⚡{m.speed}</span>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#0d1520", color: "#34d399" }}>★{m.quality}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* API 키 입력 */}
                {currentProvider.id === "builtin" ? (
                  <div style={{
                    marginBottom: 20, padding: "14px 16px", borderRadius: 12,
                    background: "#34d39908", border: "1px solid #34d39930",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#34d399", marginBottom: 4 }}>✅ API 키 불필요</div>
                    <div style={{ fontSize: 11.5, color: "#7a8a9e", lineHeight: 1.6 }}>
                      내장 Claude는 이 앱 안에서 바로 사용할 수 있어요. 별도 설정 없이 바로 시작하세요!
                    </div>
                  </div>
                ) : (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#7a8a9e", marginBottom: 8 }}>API 키</div>
                  <input type="password" value={llmSettings.apiKey} onChange={(e) => updateLLM({ apiKey: e.target.value })}
                    placeholder={currentProvider.keyPlaceholder}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #253344", background: "#0a0f1c", color: "#e2e8f0", fontSize: 13, fontFamily: "monospace", outline: "none" }}
                    onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                    onBlur={(e) => e.target.style.borderColor = "#253344"}
                  />
                  <div style={{ marginTop: 8, fontSize: 11, color: "#546478" }}>
                    키는 브라우저 로컬에만 저장됩니다 · 
                    <a href={currentProvider.signupUrl} target="_blank" rel="noopener" style={{ color: "#60a5fa", textDecoration: "none" }}>
                      {currentProvider.name} 키 발급받기 →
                    </a>
                  </div>
                </div>
                )}

                {/* 웹 검색 옵션 */}
                <div style={{
                  marginBottom: 20, padding: "16px", borderRadius: 12,
                  background: llmSettings.webSearch ? "#34d39908" : "#0a0f1c",
                  border: `1px solid ${llmSettings.webSearch ? "#34d39930" : "#1a2838"}`,
                  transition: "all 0.3s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>🌐 웹 검색 모드</div>
                      <div style={{ fontSize: 11, color: "#546478", marginTop: 2 }}>에이전트가 실시간 데이터를 검색하여 답변</div>
                    </div>
                    <button onClick={() => updateLLM({ webSearch: !llmSettings.webSearch })} style={{
                      width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                      background: llmSettings.webSearch ? "linear-gradient(135deg, #34d399, #059669)" : "#253344",
                      position: "relative", transition: "all 0.3s",
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", background: "#fff",
                        position: "absolute", top: 3,
                        left: llmSettings.webSearch ? 25 : 3,
                        transition: "left 0.3s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                      }} />
                    </button>
                  </div>

                  {llmSettings.webSearch && (
                    <div style={{ fontSize: 11, lineHeight: 1.6, color: "#7a8a9e", marginTop: 8, padding: "8px 10px", background: "#0a0f1c", borderRadius: 8 }}>
                      {currentProvider.id === "perplexity" ? (
                        <span><span style={{ color: "#34d399" }}>✅ Perplexity는 웹 검색이 자동으로 포함됩니다.</span> 모든 답변에 최신 데이터와 출처가 포함됩니다.</span>
                      ) : (currentProvider.id === "anthropic" || currentProvider.id === "builtin") ? (
                        <span><span style={{ color: "#34d399" }}>✅ Claude 웹 검색 도구가 활성화됩니다.</span> 에이전트가 필요할 때 자동으로 검색합니다.</span>
                      ) : (
                        <span><span style={{ color: "#fbbf24" }}>⚠️ {currentProvider.name}은 웹 검색을 지원하지 않습니다.</span> 웹 검색을 위해 Anthropic Claude 또는 Perplexity를 선택하세요.</span>
                      )}
                    </div>
                  )}

                  {!llmSettings.webSearch && (
                    <div style={{ fontSize: 11, color: "#546478", marginTop: 4 }}>
                      끄면 LLM 학습 데이터만으로 답변 (빠르지만 최신 정보 부족 가능)
                    </div>
                  )}
                </div>

                <button onClick={() => setShowSettings(false)} style={{
                  width: "100%", padding: "12px", borderRadius: 10, border: "none",
                  background: (currentProvider.id === "builtin" || llmSettings.apiKey) ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#253344",
                  color: (currentProvider.id === "builtin" || llmSettings.apiKey) ? "#fff" : "#546478",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>{(currentProvider.id === "builtin" || llmSettings.apiKey) ? "✅ 설정 완료" : "키를 입력해주세요"}</button>
              </div>
            </div>
          )}

          {/* 도움말 모달 */}
          {showHelp && <HelpModal onClose={() => setShowHelp(false)} isMobile={isMobile} />}
        </div>
      </div>
    );
  }

  // ===== MEETING =====
  return (
    <div style={{
      width: "100%", height: "100vh",
      background: "linear-gradient(165deg, #080d19 0%, #0f1729 40%, #111b2e 100%)",
      color: "#e2e8f0", fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
      display: "flex", flexDirection: "column", overflow: "hidden", position: "relative",
    }}>
      <style>{globalStyles}</style>

      {/* Header */}
      <header style={{
        padding: isMobile ? "8px 12px" : "10px 20px", borderBottom: "1px solid #1a2535",
        background: "rgba(12,17,30,0.85)", backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => { sessionRef.current += 1; abortRef.current = true; cancelSpeech(); setIsProcessing(false); setAgentStates({}); setAutoConverging(false); setError(null); setPhase("lobby"); }} style={{
            background: "none", border: "none", color: "#546478", cursor: "pointer", fontSize: 16,
          }}>←</button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              {template?.icon || "💬"} {template?.name || "자유 회의"}
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8,
                background: meetingMode === "auto" ? "#34d39915" : "#3b82f615",
                color: meetingMode === "auto" ? "#34d399" : "#60a5fa",
                border: `1px solid ${meetingMode === "auto" ? "#34d39930" : "#3b82f630"}`,
              }}>{meetingMode === "auto" ? "🔄 자동 수렴" : "🎮 수동"}</span>
              <span style={{ fontSize: 10, color: "#546478", background: "#0d1520", padding: "2px 8px", borderRadius: 8 }}>R{roundCount}</span>
              <button onClick={() => setShowSettings(true)} style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 8, border: "1px solid #253344",
                background: "transparent", color: "#546478", cursor: "pointer",
              }}>{currentProvider.icon} {currentModel.name}</button>
              {llmSettings.webSearch && (currentProvider.id === "builtin" || currentProvider.id === "anthropic" || currentProvider.id === "perplexity") && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: "#34d39915", color: "#34d399", border: "1px solid #34d39930" }}>🌐 검색 ON</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {meetingMode === "manual" && (
            <>
              <button onClick={triggerDebate} disabled={isProcessing || messages.length < 2} style={{
                padding: "5px 12px", borderRadius: 7, border: "1px solid #253344",
                background: isProcessing ? "transparent" : "#7f1d1d15", color: isProcessing ? "#3a4458" : "#f87171",
                fontSize: 11, cursor: isProcessing ? "not-allowed" : "pointer",
              }}>🔥{!isMobile && " 토론"}</button>
              <button onClick={() => handleSend("/결론")} disabled={isProcessing || messages.length < 3} style={{
                padding: "5px 12px", borderRadius: 7, border: "1px solid #253344",
                background: "transparent", color: messages.length >= 3 ? "#34d399" : "#3a4458",
                fontSize: 11, cursor: messages.length >= 3 ? "pointer" : "not-allowed",
              }}>📊{!isMobile && " 결론"}</button>
            </>
          )}
          {autoConverging && (
            <button onClick={stopAutoConvergence} style={{
              padding: "5px 12px", borderRadius: 7, border: "1px solid #f8717130",
              background: "#f8717115", color: "#f87171", fontSize: 11, cursor: "pointer",
            }}>⏹ 중단</button>
          )}
          <button onClick={() => setTtsEnabled(!ttsEnabled)} style={{
            padding: "5px 10px", borderRadius: 7, border: "1px solid #253344",
            background: ttsEnabled ? "#1e3a5f" : "transparent",
            color: ttsEnabled ? "#60a5fa" : "#3a4458", fontSize: 11, cursor: "pointer",
          }}>{ttsEnabled ? "🔊" : "🔇"}</button>
          <button onClick={() => setShowNotes(!showNotes)} style={{
            padding: "5px 10px", borderRadius: 7, border: "1px solid #253344",
            background: showNotes ? "#1e3a5f" : "transparent",
            color: showNotes ? "#60a5fa" : "#3a4458", fontSize: 11, cursor: "pointer",
          }}>📋</button>
          <button onClick={() => setShowSettings(true)} style={{
            padding: "5px 10px", borderRadius: 7, border: "1px solid #253344",
            background: "transparent", color: "#3a4458", fontSize: 11, cursor: "pointer",
          }}>⚙️</button>
          <button onClick={() => setShowHelp(true)} style={{
            padding: "5px 10px", borderRadius: 7, border: "1px solid #253344",
            background: "transparent", color: "#3a4458", fontSize: 11, cursor: "pointer",
          }}>❓</button>
        </div>
      </header>

      {/* 자동 수렴 진행 표시 */}
      {autoConverging && (
        <ConvergenceProgress currentRound={convergenceRound} maxRounds={4} roundLabels={convergenceLabels} status={convergenceStatus} />
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Mobile: horizontal agent bar */}
        {isMobile && (
          <div style={{
            display: "flex", gap: 10, padding: "10px 12px", overflowX: "auto",
            borderBottom: "1px solid #1a2535", background: "rgba(10,15,26,0.5)",
            WebkitOverflowScrolling: "touch", flexShrink: 0,
          }}>
            {AGENTS.map((a) => {
              const st = agentStates[a.id] || "idle";
              const active = activeAgents.includes(a.id);
              return (
                <div key={a.id} onClick={() => !isProcessing && toggleAgent(a.id)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  opacity: active ? 1 : 0.35, cursor: "pointer", flexShrink: 0,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", fontSize: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `linear-gradient(145deg, ${a.color}18, ${a.color}35)`,
                    border: st === "speaking" ? `2px solid ${a.color}` : st === "thinking" ? `2px solid ${a.color}88` : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: st === "speaking" ? `0 0 12px ${a.color}40` : "none",
                    animation: st === "thinking" ? "pulse 1.8s infinite" : undefined,
                  }}>{a.emoji}</div>
                  <span style={{ fontSize: 9, fontWeight: 600, color: active ? "#e2e8f0" : "#4a5568", whiteSpace: "nowrap" }}>{a.name}</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Desktop: vertical sidebar */}
          {!isMobile && (
            <div style={{
              width: 100, borderRight: "1px solid #1a2535", padding: "14px 4px",
              display: "flex", flexDirection: "column", gap: 12, alignItems: "center",
              overflowY: "auto", background: "rgba(10,15,26,0.5)",
            }}>
              <div style={{ fontSize: 9, color: "#3a4458", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>에이전트</div>
              {AGENTS.map((a) => (
                <AgentAvatar key={a.id} agent={a} state={agentStates[a.id] || "idle"}
                  isActive={activeAgents.includes(a.id)} onClick={() => !isProcessing && toggleAgent(a.id)} size="sm" />
              ))}
            </div>
          )}

        {/* Chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 14px" : "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "#3a4458" }}>
                <div style={{ fontSize: 40, opacity: 0.4 }}>{meetingMode === "auto" ? "🔄" : "💬"}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#546478" }}>
                  {meetingMode === "auto" ? "주제를 입력하면 자동으로 토론이 시작됩니다" : "주제를 입력하세요"}
                </div>
                <div style={{ fontSize: 12, textAlign: "center", lineHeight: 1.7, color: "#4a5c73" }}>
                  {meetingMode === "auto"
                    ? "에이전트들이 3라운드에 걸쳐 토론하고\n자동으로 결론을 도출합니다"
                    : "에이전트들이 의견을 제시하고\n🔥토론 / 📊결론 버튼으로 진행하세요"
                  }
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {["신규 사업 아이디어 검토", "마케팅 전략 회의", "조직 개편 방향"].map((t) => (
                    <button key={t} onClick={() => setInput(t)} style={{
                      padding: "6px 14px", borderRadius: 20, border: "1px solid #253344",
                      background: "transparent", color: "#7a8a9e", fontSize: 11.5, cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.color = "#60a5fa"; }}
                    onMouseOut={e => { e.target.style.borderColor = "#253344"; e.target.style.color = "#7a8a9e"; }}
                    >{t}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => <ChatBubble key={i} msg={msg} isLatest={i === messages.length - 1} />)}
            {isProcessing && !autoConverging && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#141e30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>
                  {(() => { const t = Object.entries(agentStates).find(([, s]) => s === "thinking"); return t ? AGENTS.find(a => a.id === t[0])?.emoji : "💭"; })() || "💭"}
                </div>
                <div style={{ padding: "10px 16px", borderRadius: 18, background: "#141e30", fontSize: 13, color: "#546478" }}>
                  <span className="dot1">●</span> <span className="dot2">●</span> <span className="dot3">●</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 멈춤 감지 + 강제 초기화 */}
          {isProcessing && showForceReset && (
            <div style={{ margin: "0 20px 6px", padding: "10px 14px", borderRadius: 8, background: "#fbbf2415", border: "1px solid #fbbf2430", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#fbbf24" }}>⏳ 응답이 오래 걸리고 있습니다...</span>
              <button onClick={forceReset} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#f87171", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>🔄 강제 초기화</button>
            </div>
          )}

          {error && (
            <div style={{ margin: "0 20px 6px", padding: "7px 14px", borderRadius: 8, background: "#7f1d1d22", border: "1px solid #dc262633", color: "#fca5a5", fontSize: 11, display: "flex", justifyContent: "space-between" }}>
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer" }}>✕</button>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: isMobile ? "10px 12px" : "14px 20px", borderTop: "1px solid #1a2535", background: "rgba(12,17,30,0.85)", backdropFilter: "blur(16px)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={toggleVoice} style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                border: isListening ? "2px solid #ef4444" : "1px solid #253344",
                background: isListening ? "#7f1d1d33" : "transparent",
                color: isListening ? "#ef4444" : "#3a4458", fontSize: 17, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: isListening ? "glow 1.5s infinite" : "none",
              }}>🎙️</button>
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={autoConverging ? "자동 수렴 진행 중..." : meetingMode === "auto" ? "주제를 입력하면 자동으로 3라운드 토론 → 결론 도출" : "메시지 입력... (/결론 으로 결론 도출)"}
                disabled={isProcessing}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 12,
                  border: "1px solid #253344", background: "#0a0f1c",
                  color: "#e2e8f0", fontSize: 13.5, outline: "none", fontFamily: "inherit",
                }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.target.style.borderColor = "#253344"}
              />
              <button onClick={() => handleSend()} disabled={isProcessing || !input.trim()} style={{
                width: 40, height: 40, borderRadius: 11, border: "none", flexShrink: 0,
                background: isProcessing || !input.trim() ? "#141e30" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: isProcessing || !input.trim() ? "#3a4458" : "#fff",
                fontSize: 17, cursor: isProcessing ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>➤</button>
            </div>
          </div>
        </div>

        {/* Notes */}
        {showNotes && (
          <div style={{
            ...(isMobile ? {
              position: "absolute", top: 0, right: 0, bottom: 0, width: "85%", maxWidth: 300,
              zIndex: 30, animation: "slideInRight 0.2s ease",
              background: "rgba(10,15,26,0.97)", backdropFilter: "blur(12px)",
            } : {
              width: 250, animation: "fadeSlideIn 0.2s ease",
              background: "rgba(10,15,26,0.5)",
            }),
            borderLeft: "1px solid #1a2535", padding: 14,
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>📋 회의록</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={exportReport} disabled={meetingNotes.length === 0} style={{
                  padding: "3px 9px", borderRadius: 6, border: "1px solid #253344",
                  background: "transparent", color: meetingNotes.length ? "#60a5fa" : "#3a4458",
                  fontSize: 10, cursor: meetingNotes.length ? "pointer" : "not-allowed",
                }}>💾</button>
                {isMobile && <button onClick={() => setShowNotes(false)} style={{
                  background: "none", border: "none", color: "#546478", fontSize: 16, cursor: "pointer",
                }}>✕</button>}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {meetingNotes.length === 0
                ? <div style={{ fontSize: 11, color: "#3a4458", textAlign: "center", marginTop: 32 }}>회의 시작 시 자동 기록</div>
                : meetingNotes.map((n, i) => (
                  <div key={i} style={{
                    fontSize: 10, color: "#7a8a9e", padding: "6px 8px",
                    borderRadius: 6, background: "#0a0f1c55", lineHeight: 1.5,
                    borderLeft: "2px solid #253344",
                  }}>{n}</div>
                ))
              }
            </div>
          </div>
        )}
        </div>{/* end desktop flex row */}
      </div>{/* end main */}

      {/* Conclusion Report */}
      {showConclusion && (
        <ConclusionReport data={conclusionData} onClose={() => setShowConclusion(false)} onExport={exportReport} />
      )}

      {/* LLM 설정 모달 (회의 중에서도 접근 가능) */}
      {showSettings && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeSlideIn 0.3s ease" }}
          onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
          <div style={{ background: "linear-gradient(160deg, #0f1829, #162038)", border: "1px solid #253344", borderRadius: 20, padding: 28, maxWidth: 520, width: "92%", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>⚙️ LLM 모델 설정</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", color: "#546478", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#7a8a9e", marginBottom: 8 }}>AI 제공자</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {LLM_PROVIDERS.map((p) => (
                  <button key={p.id} onClick={() => updateLLM({ providerId: p.id, modelId: p.models[0].id })} style={{
                    padding: "10px 12px", borderRadius: 10, textAlign: "left",
                    background: llmSettings.providerId === p.id ? "#1e3a5f20" : "#0a0f1c",
                    border: `2px solid ${llmSettings.providerId === p.id ? "#3b82f6" : "#1a2838"}`, cursor: "pointer",
                  }}>
                    <div style={{ fontSize: 13 }}>{p.icon} <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{p.name}</span></div>
                    <div style={{ fontSize: 10, color: p.free ? "#34d399" : "#fbbf24" }}>{p.cost}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#7a8a9e", marginBottom: 8 }}>모델</div>
              {currentProvider.models.map((m) => (
                <button key={m.id} onClick={() => updateLLM({ modelId: m.id })} style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8, textAlign: "left", marginBottom: 4,
                  background: llmSettings.modelId === m.id ? "#1e3a5f20" : "#0a0f1c",
                  border: `1px solid ${llmSettings.modelId === m.id ? "#3b82f6" : "#1a2838"}`, cursor: "pointer",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{m.name}</span>
                  <span style={{ fontSize: 10, color: "#546478", marginLeft: 8 }}>{m.desc}</span>
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#7a8a9e", marginBottom: 8 }}>API 키</div>
              <input type="password" value={llmSettings.apiKey} onChange={(e) => updateLLM({ apiKey: e.target.value })}
                placeholder={currentProvider.keyPlaceholder}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #253344", background: "#0a0f1c", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 16, padding: "12px", borderRadius: 10, background: llmSettings.webSearch ? "#34d39908" : "#0a0f1c", border: `1px solid ${llmSettings.webSearch ? "#34d39930" : "#1a2838"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>🌐 웹 검색 모드</span>
                <button onClick={() => updateLLM({ webSearch: !llmSettings.webSearch })} style={{
                  width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                  background: llmSettings.webSearch ? "#34d399" : "#253344", position: "relative",
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: llmSettings.webSearch ? 23 : 3, transition: "left 0.3s" }} />
                </button>
              </div>
              <div style={{ fontSize: 10, color: "#546478", marginTop: 4 }}>
                {llmSettings.webSearch ? (currentProvider.id === "builtin" || currentProvider.id === "anthropic" || currentProvider.id === "perplexity" ? "✅ 실시간 데이터 검색 활성화" : "⚠️ 이 제공자는 웹검색 미지원") : "LLM 학습 데이터만 사용"}
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} style={{
              width: "100%", padding: "10px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>확인</button>
          </div>
        </div>
      )}

      {/* 도움말 모달 */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} isMobile={isMobile} />}
    </div>
  );
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap');
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 5px #ef444444} 50%{box-shadow:0 0 20px #ef444466} }
  @keyframes dotPulse { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
  @keyframes slideInLeft { from{transform:translateX(-100%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #253344; border-radius: 4px; }
  input::placeholder { color: #3a4458; }
  .dot1 { animation: dotPulse 1.2s infinite; }
  .dot2 { animation: dotPulse 1.2s 0.2s infinite; }
  .dot3 { animation: dotPulse 1.2s 0.4s infinite; }
`;

// 모바일 감지 훅
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}
