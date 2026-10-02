import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, ReactNode } from 'react'
import './App.css'

type TaskType = 'qna' | 'research' | 'build'
type ModelMode = 'auto' | 'fast' | 'smart' | 'deep'
type ExecutionStatus = 'queued' | 'running' | 'complete' | 'failed'

type Agent = {
  id: string
  name: string
  role: string
  personality: string
  emoji: string
  color: string
  status: 'ready' | 'busy' | 'offline'
}

type Task = {
  id: number
  title: string
  description: string
  status: 'inbox' | 'active' | 'done'
  taskType: TaskType
  executionTarget: 'cloud' | 'mac'
  executionStatus: ExecutionStatus
  modelMode: ModelMode
  modelUsed: string | null
  routeReason: string | null
  attemptCount: number
  scheduleId: number | null
  scheduleName: string | null
  archiveKey: string | null
  teamAgents: string[]
  collaborators: string[]
  allowRecruits: number
  result: string | null
  error: string | null
  sources: Array<{ title: string; url: string }>
  agentId: string | null
  agentName: string | null
  agentEmoji: string | null
  agentColor: string | null
  createdAt: string
  completedAt: string | null
}

type Schedule = {
  id: number
  name: string
  prompt: string
  taskType: 'qna' | 'research'
  modelMode: ModelMode
  cadence: 'daily' | 'twice_daily'
  timeOne: string
  timeTwo: string | null
  timezone: string
  teamAgents: string[]
  allowRecruits: number
  enabled: number
  lastRunAt: string | null
  lastTaskId: number | null
  lastTaskStatus: ExecutionStatus | null
}

type NotificationSettings = {
  notificationEmail: string
  emailConnected: boolean
  sender?: string
}

type Runner = {
  id: string
  name: string
  lastSeenAt: string
  online: number
}

type FeedEntry = {
  id: number
  kind: 'handoff' | 'note' | 'sprint'
  message: string
  taskId: number | null
  createdAt: string
  speakerId: string
  speakerName: string
  speakerEmoji: string
  speakerColor: string
  recipientId: string | null
  recipientName: string | null
  recipientEmoji: string | null
}

type Bond = {
  handoffs: number
  rapport: number
  quirk: string
  agentAId: string
  agentAName: string
  agentAEmoji: string
  agentBId: string
  agentBName: string
  agentBEmoji: string
}

type ChatEntry = {
  id: number
  message: string
  mood: string
  turnIndex: number
  createdAt: string
  speakerId: string
  speakerName: string
  speakerEmoji: string
  speakerColor: string
  recipientId: string
  recipientName: string
  recipientEmoji: string
  contextKind: 'news' | 'holiday' | 'office'
  contextTitle: string | null
  contextUrl: string | null
  contextSource: string | null
  conversationKey: string | null
  burstIndex: number
  continuity: number
}

type ImprovementStatus = 'proposed' | 'build_approved' | 'building' | 'awaiting_deploy' | 'deploy_approved' | 'deploying' | 'shipped' | 'rejected' | 'failed' | 'blocked'

type ImprovementProposal = {
  id: number
  rotationKey: string
  title: string
  problem: string
  proposal: string
  benefit: string
  requestedBy: string[]
  affectedAgents: string[]
  acceptanceTests: string[]
  permissions: string[]
  riskLevel: 'low' | 'medium' | 'high'
  estimatedCost: string
  planModel: string
  actionModel: string
  managerAgentId: string
  managerDecision: 'approved' | 'revised'
  managerReview: string
  managerModel: string
  managerReviewedAt: string
  status: ImprovementStatus
  branchName: string | null
  baseCommit: string | null
  buildSummary: string | null
  buildError: string | null
  deploySummary: string | null
  deployError: string | null
  createdAt: string
  completedAt: string | null
}

type Capability = {
  id: number
  slug: string
  name: string
  kind: 'skill' | 'tool' | 'plugin'
  description: string
  ownerAgentId: string | null
  ownerAgentName: string | null
  permissions: string[]
  status: 'experimental' | 'active' | 'retired'
  sourceProposalId: number | null
}

type ImprovementEvent = {
  id: number
  proposalId: number
  eventType: string
  actor: string
  detail: string
  createdAt: string
}

type WorkshopData = {
  proposals: ImprovementProposal[]
  capabilities: Capability[]
  events: ImprovementEvent[]
  rotationSchedule: string
  policy: string
}

type SocialState = {
  agentId: string
  agentName: string
  agentEmoji: string
  agentColor: string
  mood: string
  activity: string
  lastTopic: string | null
  updatedAt: string
}

type LeadershipEvent = {
  id: number
  kind: 'one_on_one' | 'training' | 'morale' | 'team_building'
  title: string
  message: string
  dayKey: string
  createdAt: string
  agentId: string | null
  agentName: string | null
  agentEmoji: string | null
  leaderAgentId: string | null
  leaderAgentName: string | null
  leaderAgentEmoji: string | null
}

type PerformanceMetric = {
  agentId: string
  name: string
  role: string
  assignments: number
  completed: number
  failed: number
  research: number
  builds: number
  handoffsGiven: number
  handoffsReceived: number
}

type PerformanceReview = {
  id: number
  cycleKey: string
  periodStart: string
  periodEnd: string
  report: string
  metrics: PerformanceMetric[]
  createdAt: string
}

type CommandMessage = {
  id: number
  role: 'user' | 'assistant'
  audienceAgentId: string
  agentId: string | null
  agentName: string | null
  agentEmoji: string | null
  agentColor: string | null
  mode: 'qna' | 'research'
  content: string
  modelMode: ModelMode
  modelUsed: string | null
  sources: Array<{ title: string; url: string }>
  collaborators: string[]
  teamReason: string | null
  status: 'queued' | 'running' | 'complete' | 'failed'
  error: string | null
  replyToId: number | null
  createdAt: string
  completedAt: string | null
}

type UserProfile = {
  displayName: string
  summary: string
  communicationStyle: string
  decisionStyle: string
  collaborationStyle: string
  updatedAt: string
}

type KnowledgeNode = {
  id: string
  category: 'trait' | 'interest' | 'preference' | 'dislike' | 'style' | 'goal' | 'context'
  label: string
  description: string
  confidence: number
  evidenceCount: number
  contributedBy: string[]
  source: 'baseline' | 'conversation' | 'correction'
  firstSeenAt: string
  lastSeenAt: string
}

type KnowledgeEdge = {
  fromNodeId: string
  relation: string
  toNodeId: string
  weight: number
  evidenceCount: number
}

type KnowledgeRelationship = {
  fromNodeId: string
  relation: string
  toNodeId: string
  rationale: string
  weight: number
  evidenceCount: number
  contributedBy: string[]
}

type VectorStatus = {
  indexed: number
  pending: number
  model: string
}

type ProfileData = {
  profile: UserProfile | null
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  relationships: KnowledgeRelationship[]
  vectorStatus: VectorStatus
  policy: string
}

type Office = {
  agents: Agent[]
  tasks: Task[]
  runner: Runner | null
  feed: FeedEntry[]
  chat: ChatEntry[]
  bonds: Bond[]
  socialStates: SocialState[]
  leadershipEvents: LeadershipEvent[]
  performanceReview: PerformanceReview | null
  nextPerformanceReviewAt: string | null
  reviewSchedule: string
  chatSchedule: string
  schedules: Schedule[]
  settings: NotificationSettings
  commandMessages: CommandMessage[]
  chatRetention: string
  profileData: ProfileData
  workshopData: WorkshopData
}

async function fetchOffice(): Promise<Office> {
  const [agentsResponse, tasksResponse, statusResponse, feedResponse, schedulesResponse, settingsResponse, chatResponse, profileResponse, workshopResponse] = await Promise.all([
    fetch('/api/agents'),
    fetch('/api/tasks'),
    fetch('/api/status'),
    fetch('/api/feed'),
    fetch('/api/schedules'),
    fetch('/api/settings'),
    fetch('/api/chat'),
    fetch('/api/profile'),
    fetch('/api/workshop'),
  ])
  if (!agentsResponse.ok || !tasksResponse.ok || !statusResponse.ok || !feedResponse.ok || !schedulesResponse.ok || !settingsResponse.ok || !chatResponse.ok || !profileResponse.ok || !workshopResponse.ok) {
    throw new Error('The office could not be loaded.')
  }
  const agentsData = await agentsResponse.json() as { agents: Agent[] }
  const tasksData = await tasksResponse.json() as { tasks: Task[] }
  const statusData = await statusResponse.json() as { runner: Runner | null }
  const feedData = await feedResponse.json() as {
    feed: FeedEntry[]
    chat: ChatEntry[]
    bonds: Bond[]
    socialStates: SocialState[]
    leadershipEvents: LeadershipEvent[]
    performanceReview: PerformanceReview | null
    nextPerformanceReviewAt: string | null
    reviewSchedule: string
    chatSchedule: string
  }
  const schedulesData = await schedulesResponse.json() as { schedules: Schedule[] }
  const settingsData = await settingsResponse.json() as NotificationSettings
  const chatData = await chatResponse.json() as { messages: CommandMessage[]; retention: string }
  const profileData = await profileResponse.json() as ProfileData
  const workshopData = await workshopResponse.json() as WorkshopData
  return {
    agents: agentsData.agents,
    tasks: tasksData.tasks,
    runner: statusData.runner,
    feed: feedData.feed,
    chat: feedData.chat,
    bonds: feedData.bonds,
    socialStates: feedData.socialStates,
    leadershipEvents: feedData.leadershipEvents,
    performanceReview: feedData.performanceReview,
    nextPerformanceReviewAt: feedData.nextPerformanceReviewAt,
    reviewSchedule: feedData.reviewSchedule,
    chatSchedule: feedData.chatSchedule,
    schedules: schedulesData.schedules,
    settings: settingsData,
    commandMessages: chatData.messages,
    chatRetention: chatData.retention,
    profileData,
    workshopData,
  }
}

function cleanMarkdown(value: string) {
  return value
    .replace(/cite[^]+/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

function inlineMarkdown(value: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*\n]+)\*\*|__([^_\n]+)__|`([^`\n]+)`|\*([^*\n]+)\*|_([^_\n]+)_|~~([^~\n]+)~~)/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) nodes.push(value.slice(cursor, match.index))
    const key = `${keyPrefix}-${match.index}`
    if (match[2] && match[3]) {
      nodes.push(<a href={match[3]} target="_blank" rel="noreferrer" key={key}>{match[2]}</a>)
    } else if (match[4] || match[5]) {
      nodes.push(<strong key={key}>{match[4] || match[5]}</strong>)
    } else if (match[6]) {
      nodes.push(<code key={key}>{match[6]}</code>)
    } else if (match[7] || match[8]) {
      nodes.push(<em key={key}>{match[7] || match[8]}</em>)
    } else if (match[9]) {
      nodes.push(<s key={key}>{match[9]}</s>)
    }
    cursor = match.index + match[0].length
  }

  if (cursor < value.length) nodes.push(value.slice(cursor))
  return nodes
}

function isMarkdownBlockStart(line: string) {
  const trimmed = line.trim()
  return !trimmed
    || /^```/.test(trimmed)
    || /^#{1,6}\s+/.test(trimmed)
    || /^(?:[-*+] |•\s+)/.test(trimmed)
    || /^\d+[.)]\s+/.test(trimmed)
    || /^>\s?/.test(trimmed)
    || /^(?:---+|___+|\*\*\*+)$/.test(trimmed)
    || /^[A-Z0-9][A-Z0-9 &'’·:–—/-]{4,}$/.test(trimmed)
}

function MarkdownContent({ value, className = '' }: { value: string; className?: string }) {
  const lines = cleanMarkdown(value).split('\n')
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()
    if (!trimmed) {
      index += 1
      continue
    }

    const fence = trimmed.match(/^```([^\s`]*)\s*$/)
    if (fence) {
      const code: string[] = []
      index += 1
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        code.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      blocks.push(<pre key={`code-${index}`}><code className={fence[1] ? `language-${fence[1]}` : undefined}>{code.join('\n')}</code></pre>)
      continue
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/)
    const displayHeading = heading?.[2] || (/^[A-Z0-9][A-Z0-9 &'’·:–—/-]{4,}$/.test(trimmed) ? trimmed : null)
    if (displayHeading) {
      blocks.push(<h4 className="markdown-heading" key={`heading-${index}`}>{inlineMarkdown(displayHeading, `heading-${index}`)}</h4>)
      index += 1
      continue
    }

    if (/^(?:---+|___+|\*\*\*+)$/.test(trimmed)) {
      blocks.push(<hr key={`rule-${index}`} />)
      index += 1
      continue
    }

    if (/^(?:[-*+] |•\s+)/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^(?:[-*+] |•\s+)/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^(?:[-*+] |•\s+)/, ''))
        index += 1
      }
      blocks.push(<ul key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item, `list-${index}-${itemIndex}`)}</li>)}</ul>)
      continue
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ''))
        index += 1
      }
      blocks.push(<ol key={`ordered-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item, `ordered-${index}-${itemIndex}`)}</li>)}</ol>)
      continue
    }

    if (/^>\s?/.test(trimmed)) {
      const quote: string[] = []
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quote.push(lines[index].trim().replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push(<blockquote key={`quote-${index}`}>{inlineMarkdown(quote.join(' '), `quote-${index}`)}</blockquote>)
      continue
    }

    const paragraph = [trimmed]
    index += 1
    while (index < lines.length && !isMarkdownBlockStart(lines[index])) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push(<p key={`paragraph-${index}`}>{paragraph.map((part, partIndex) => (
      <Fragment key={partIndex}>{partIndex > 0 && <br />}{inlineMarkdown(part, `paragraph-${index}-${partIndex}`)}</Fragment>
    ))}</p>)
  }

  return <div className={`markdown-content ${className}`.trim()}>{blocks}</div>
}

function formatReviewDate(value: string) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatReviewDay(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function Icon({ name }: { name: 'home' | 'team' | 'tasks' | 'sparkles' }) {
  const paths = {
    home: <path d="M3 10.5 10 4l7 6.5V18a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1v-7.5Z" />,
    team: <><circle cx="7" cy="8" r="3" /><circle cx="15.5" cy="9" r="2.5" /><path d="M2.5 18c.4-3 2-4.5 4.5-4.5s4.1 1.5 4.5 4.5M12 17.5c.4-2.3 1.6-3.5 3.5-3.5 2.1 0 3.3 1.3 3.5 4" /></>,
    tasks: <><rect x="3" y="4" width="16" height="15" rx="3" /><path d="m7 10 1.5 1.5L12 8M7 15h8" /></>,
    sparkles: <><circle cx="11" cy="11" r="3.2" /><circle cx="11" cy="11" r="7.5" /><path d="M11 2v5.8M11 14.2V20M2 11h5.8M14.2 11H20M4.6 4.6l4.1 4.1M13.3 13.3l4.1 4.1M17.4 4.6l-4.1 4.1M8.7 13.3l-4.1 4.1" /></>,
  }
  return <svg viewBox="0 0 22 22" aria-hidden="true">{paths[name]}</svg>
}

const agentPortraits: Record<string, { src: string; position: string; scale?: number; origin?: string }> = {
  atlas: { src: '/agents/vader.jpeg', position: '50% 45%' },
  scout: { src: '/agents/fett.jpeg', position: '50% 17%', scale: 2.15, origin: '50% 18%' },
  pixel: { src: '/agents/tarkin.jpeg', position: '50% 43%' },
  muse: { src: '/agents/palpatine.jpeg', position: '50% 43%' },
}

function AgentPortrait({
  id,
  name,
  fallback = '●',
  className = '',
}: {
  id: string | null | undefined
  name?: string | null
  fallback?: string | null
  className?: string
}) {
  const portrait = id ? agentPortraits[id] : undefined
  if (id === 'luke') return <span className={`agent-portrait luke-portrait ${className}`.trim()} title={name || undefined}>⌘</span>
  if (!portrait) return <span className={className}>{fallback || '●'}</span>
  return (
    <span className={`agent-portrait ${className}`.trim()} title={name || undefined}>
      <img
        src={portrait.src}
        alt={name ? `${name} portrait` : ''}
        style={{
          objectPosition: portrait.position,
          transform: `scale(${portrait.scale || 1.035})`,
          transformOrigin: portrait.origin || 'center',
        }}
      />
    </span>
  )
}

function contributionText(agentId: string, taskType: TaskType) {
  if (agentId === 'atlas') return 'Scoped the request, assigned the work, reconciled the specialist views, and owned the final response.'
  if (agentId === 'scout') return taskType === 'research'
    ? 'Gathered the live evidence, checked practical risk, and returned the source trail.'
    : 'Verified the factual claims and returned the useful evidence.'
  if (agentId === 'pixel') return taskType === 'build'
    ? 'Led the architecture and implementation, then checked the result against the request.'
    : taskType === 'research'
      ? 'Validated the evidence, challenged weak assumptions, and structured the answer.'
      : 'Tested the assumptions and supplied the technical or implementation structure.'
  if (agentId === 'luke') return taskType === 'build'
    ? 'Prototyped the approved improvement inside a guarded worktree and returned test evidence to Palpatine.'
    : 'Contributed first-hand workshop or technical context as the intern; Palpatine retained managerial judgment and accountability.'
  return 'Pressure-tested the strategy, risks, incentives, and implementation path while mentoring the specialists.'
}

function CouncilContributions({
  ids,
  agents,
  taskType,
  reason,
  privateAudience = false,
}: {
  ids: string[]
  agents: Agent[]
  taskType: TaskType
  reason?: string | null
  privateAudience?: boolean
}) {
  const members = [...new Set(ids)]
    .map((id) => agents.find((agent) => agent.id === id))
    .filter((agent): agent is Agent => Boolean(agent))
  if (members.length < 2) return null

  return (
    <details className="contribution-map" open>
      <summary>{privateAudience ? 'Private consultation' : 'Council work'} <span>{members.length} contributors</span></summary>
      {reason && <p className="contribution-reason">{reason}</p>}
      <div className="contribution-list">
        {members.map((agent) => (
          <div className="contribution-entry" key={agent.id}>
            <AgentPortrait id={agent.id} name={agent.name} fallback={agent.emoji} className="contribution-portrait" />
            <div>
              <strong>{agent.name}</strong>
              <span>{agent.role}</span>
              <p>{contributionText(agent.id, taskType)}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="contribution-truth">{privateAudience
        ? 'One bounded answer call used these roles. The private conversation stays out of the public handoff board.'
        : 'One bounded answer call used these assigned functions; the handoff and return trail remains visible on the Comms Board.'}</p>
    </details>
  )
}

const taskModes: Array<{ id: TaskType; emoji: string; label: string; hint: string }> = [
  { id: 'qna', emoji: '💬', label: 'Ask', hint: 'Cloud · quick answer' },
  { id: 'research', emoji: '🔎', label: 'Research', hint: 'Cloud · live web' },
  { id: 'build', emoji: '🛠️', label: 'Build', hint: 'Mac · edits files' },
]

const modelModes: Array<{ id: ModelMode; label: string; hint: string }> = [
  { id: 'auto', label: 'Auto', hint: 'Best value' },
  { id: 'fast', label: 'Fast', hint: 'Luna' },
  { id: 'smart', label: 'Smart', hint: 'Sol' },
  { id: 'deep', label: 'Deep', hint: 'Astra' },
]

const audienceOptions = [
  { id: 'atlas', name: 'Darth Vader', label: 'Vader', hint: 'Routes the council', emoji: '◉' },
  { id: 'scout', name: 'Boba Fett', label: 'Fett', hint: 'Private field view', emoji: '⌖' },
  { id: 'pixel', name: 'Grand Moff Tarkin', label: 'Tarkin', hint: 'Private architecture view', emoji: '△' },
  { id: 'muse', name: 'Emperor Palpatine', label: 'Palpatine', hint: 'Strategy · manages Luke', emoji: '✦' },
] as const

function statusLabel(task: Task) {
  if (task.executionStatus === 'queued' && task.executionTarget === 'mac') return 'Waiting for Mac'
  if (task.executionStatus === 'queued' && task.attemptCount > 0) return 'Retry queued'
  if (task.executionStatus === 'queued') return 'Queued'
  if (task.executionStatus === 'running') return task.taskType === 'research' ? `Researching · ${task.attemptCount}/2` : 'Working'
  if (task.executionStatus === 'failed') return 'Needs attention'
  return 'Complete'
}

function improvementStatusLabel(status: ImprovementStatus) {
  return {
    proposed: 'Palpatine cleared · awaiting your build approval',
    build_approved: 'Queued for Mac',
    building: 'Building in worktree',
    awaiting_deploy: 'Awaiting deploy approval',
    deploy_approved: 'Release queued',
    deploying: 'Running release checks',
    shipped: 'Shipped',
    rejected: 'Declined',
    failed: 'Needs review',
    blocked: 'Paused safely',
  }[status]
}

function App() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [runner, setRunner] = useState<Runner | null>(null)
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [chat, setChat] = useState<ChatEntry[]>([])
  const [bonds, setBonds] = useState<Bond[]>([])
  const [socialStates, setSocialStates] = useState<SocialState[]>([])
  const [leadershipEvents, setLeadershipEvents] = useState<LeadershipEvent[]>([])
  const [performanceReview, setPerformanceReview] = useState<PerformanceReview | null>(null)
  const [nextPerformanceReviewAt, setNextPerformanceReviewAt] = useState<string | null>(null)
  const [reviewSchedule, setReviewSchedule] = useState('Daily at 9:00 AM ET')
  const [chatSchedule, setChatSchedule] = useState('World pulse · social bursts · resets nightly')
  const chatStreamRef = useRef<HTMLDivElement | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({ notificationEmail: '', emailConnected: false })
  const [commandMessages, setCommandMessages] = useState<CommandMessage[]>([])
  const [chatRetention, setChatRetention] = useState('Distilled into shared memory, then cleared after midnight ET')
  const [profileData, setProfileData] = useState<ProfileData>({
    profile: null,
    nodes: [],
    edges: [],
    relationships: [],
    vectorStatus: { indexed: 0, pending: 0, model: 'BGE Base English' },
    policy: '',
  })
  const [workshopData, setWorkshopData] = useState<WorkshopData>({
    proposals: [],
    capabilities: [],
    events: [],
    rotationSchedule: 'Tuesday and Friday at 10:30 AM ET',
    policy: '',
  })
  const commandThreadRef = useRef<HTMLDivElement | null>(null)
  const [title, setTitle] = useState('')
  const [agentId, setAgentId] = useState('')
  const [audienceAgentId, setAudienceAgentId] = useState('atlas')
  const [taskType, setTaskType] = useState<TaskType>('qna')
  const [modelMode, setModelMode] = useState<ModelMode>('auto')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [retrying, setRetrying] = useState<number | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [archiveNotice, setArchiveNotice] = useState('')
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduleName, setScheduleName] = useState('')
  const [schedulePrompt, setSchedulePrompt] = useState('')
  const [scheduleCadence, setScheduleCadence] = useState<'daily' | 'twice_daily'>('daily')
  const [scheduleTimeOne, setScheduleTimeOne] = useState('08:00')
  const [scheduleTimeTwo, setScheduleTimeTwo] = useState('18:00')
  const [scheduleType, setScheduleType] = useState<'qna' | 'research'>('research')
  const [scheduleModel, setScheduleModel] = useState<ModelMode>('auto')
  const [scheduleTeam, setScheduleTeam] = useState<string[]>(['atlas', 'scout', 'pixel', 'muse'])
  const [allowRecruits, setAllowRecruits] = useState(true)
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [scheduleBusy, setScheduleBusy] = useState<number | null>(null)
  const [notificationEmail, setNotificationEmail] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [workshopBusy, setWorkshopBusy] = useState<number | null>(null)
  const [error, setError] = useState('')
  const visibleCommandMessages = commandMessages.filter((message) => message.audienceAgentId === audienceAgentId)
  const latestCommandStatus = visibleCommandMessages[visibleCommandMessages.length - 1]?.status
  const commandBusy = visibleCommandMessages.some((message) => message.status === 'queued' || message.status === 'running')
  const selectedAudience = audienceOptions.find((option) => option.id === audienceAgentId) || audienceOptions[0]
  const directAudience = audienceAgentId !== 'atlas'

  const refresh = useCallback(async (quiet = false) => {
    try {
      const office = await fetchOffice()
      setAgents(office.agents)
      setTasks(office.tasks)
      setRunner(office.runner)
      setFeed(office.feed)
      setChat(office.chat)
      setBonds(office.bonds)
      setSocialStates(office.socialStates)
      setLeadershipEvents(office.leadershipEvents)
      setPerformanceReview(office.performanceReview)
      setNextPerformanceReviewAt(office.nextPerformanceReviewAt)
      setReviewSchedule(office.reviewSchedule)
      setChatSchedule(office.chatSchedule)
      setSchedules(office.schedules)
      setSettings(office.settings)
      setCommandMessages(office.commandMessages)
      setChatRetention(office.chatRetention)
      setProfileData(office.profileData)
      setWorkshopData(office.workshopData)
      setNotificationEmail((current) => current || office.settings.notificationEmail)
      setError('')
    } catch (loadError) {
      if (!quiet) setError(loadError instanceof Error ? loadError.message : 'Something went wrong.')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0)
    const timer = window.setInterval(() => void refresh(true), 5000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
    }
  }, [refresh])

  useEffect(() => {
    const stream = chatStreamRef.current
    if (stream) stream.scrollTop = stream.scrollHeight
  }, [chat.length])

  useEffect(() => {
    const thread = commandThreadRef.current
    if (thread) thread.scrollTop = thread.scrollHeight
  }, [visibleCommandMessages.length, latestCommandStatus])

  const addTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch(taskType === 'build' ? '/api/tasks' : '/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskType === 'build'
          ? { title, agentId: agentId || null, taskType, modelMode }
          : { content: title, mode: taskType, modelMode, audienceAgentId }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'The message could not be sent.')
      setTitle('')
      if (taskType !== 'build') setArchiveNotice('')
      await refresh(true)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const startNewChat = async () => {
    if (visibleCommandMessages.length === 0 || commandBusy || archiving) return
    setArchiving(true)
    setError('')
    try {
      const response = await fetch('/api/chat/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audienceAgentId }),
      })
      const data = await response.json() as { taskId?: number; error?: string }
      if (!response.ok || !data.taskId) throw new Error(data.error || 'The conversation could not be archived.')
      setTitle('')
      setArchiveNotice(`${selectedAudience.label} conversation archived as Order #${data.taskId}.`)
      await refresh(true)
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Something went wrong.')
    } finally {
      setArchiving(false)
    }
  }

  const retryTask = async (id: number) => {
    setRetrying(id)
    setError('')
    try {
      const response = await fetch(`/api/tasks/${id}/retry`, { method: 'POST' })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'The task could not be retried.')
      await refresh(true)
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Something went wrong.')
    } finally {
      setRetrying(null)
    }
  }

  const createSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!scheduleName.trim() || !schedulePrompt.trim() || scheduleSaving) return
    setScheduleSaving(true)
    setError('')
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scheduleName,
          prompt: schedulePrompt,
          cadence: scheduleCadence,
          timeOne: scheduleTimeOne,
          timeTwo: scheduleTimeTwo,
          taskType: scheduleType,
          modelMode: scheduleModel,
          teamAgents: scheduleTeam,
          allowRecruits,
        }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'The schedule could not be saved.')
      setScheduleName('')
      setSchedulePrompt('')
      setShowScheduleForm(false)
      await refresh(true)
    } catch (scheduleError) {
      setError(scheduleError instanceof Error ? scheduleError.message : 'Something went wrong.')
    } finally {
      setScheduleSaving(false)
    }
  }

  const updateSchedule = async (schedule: Schedule, action: 'toggle' | 'run' | 'delete') => {
    setScheduleBusy(schedule.id)
    setError('')
    try {
      const url = action === 'run' ? `/api/schedules/${schedule.id}/run` : `/api/schedules/${schedule.id}`
      const response = await fetch(url, action === 'toggle'
        ? { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !schedule.enabled }) }
        : { method: action === 'delete' ? 'DELETE' : 'POST' })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'The schedule could not be updated.')
      await refresh(true)
    } catch (scheduleError) {
      setError(scheduleError instanceof Error ? scheduleError.message : 'Something went wrong.')
    } finally {
      setScheduleBusy(null)
    }
  }

  const saveNotificationEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSettingsSaving(true)
    setError('')
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationEmail }),
      })
      const data = await response.json() as NotificationSettings & { error?: string }
      if (!response.ok) throw new Error(data.error || 'The alert address could not be saved.')
      setSettings((current) => ({ ...current, ...data }))
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : 'Something went wrong.')
    } finally {
      setSettingsSaving(false)
    }
  }

  const updateWorkshop = async (proposal: ImprovementProposal, action: 'approve_build' | 'approve_deploy' | 'reject') => {
    setWorkshopBusy(proposal.id)
    setError('')
    try {
      const response = await fetch(`/api/workshop/proposals/${proposal.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'The workshop decision could not be saved.')
      await refresh(true)
    } catch (workshopError) {
      setError(workshopError instanceof Error ? workshopError.message : 'Something went wrong.')
    } finally {
      setWorkshopBusy(null)
    }
  }

  const toggleTeamMember = (id: string) => {
    if (id === 'atlas') return
    setScheduleTeam((current) => current.includes(id)
      ? current.filter((member) => member !== id)
      : [...current, id])
  }

  const openTaskCount = tasks.filter((task) => ['queued', 'running'].includes(task.executionStatus)).length
  const latestSprint = feed.find((entry) => entry.kind === 'sprint')
  const handoffs = feed.filter((entry) => entry.kind !== 'sprint')
  const runnerOnline = Boolean(runner?.online)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const officeDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }).format(new Date())

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Imperial Command home">
          <span className="brand-mark"><Icon name="sparkles" /></span>
          <span>Imperial Command</span>
        </a>
        <nav>
          <a className="nav-link active" href="#top"><Icon name="home" /><span>Overview</span></a>
          <a className="nav-link" href="#profile"><Icon name="team" /><span>Your profile</span></a>
          <a className="nav-link" href="#comms"><Icon name="sparkles" /><span>Comms board</span></a>
          <a className="nav-link" href="#schedules"><Icon name="tasks" /><span>Scheduled missions</span></a>
          <a className="nav-link" href="#workshop"><Icon name="sparkles" /><span>Luke’s Workshop</span></a>
          <a className="nav-link" href="#team"><Icon name="team" /><span>The team</span></a>
          <a className="nav-link" href="#tasks"><Icon name="tasks" /><span>Tasks</span></a>
        </nav>
        <div className="sidebar-note">
          <span className={`pulse ${runnerOnline ? '' : 'offline'}`} /> Mac runner
          <strong>{runnerOnline ? 'Online and ready' : 'Mac is offline'}</strong>
        </div>
      </aside>

      <main id="top">
        <header className="topbar">
          <a className="mobile-brand" href="#top">
            <span className="brand-mark"><Icon name="sparkles" /></span>
            <span>Imperial Command</span>
          </a>
          <div className="online-pill"><span className="pulse" /> Command network online</div>
          <button className="avatar" type="button" aria-label="Your profile">SM</button>
        </header>

        <div className="content">
          <section className="welcome">
            <div>
              <p className="eyebrow">{officeDate} · Imperial command deck</p>
              <h1>{greeting}, Commander.</h1>
              <p>Issue orders from anywhere, scan the live web, or dispatch a build to your Mac.</p>
            </div>
            <div className="overview-stat">
              <strong>{loading ? '—' : openTaskCount}</strong>
              <span>open {openTaskCount === 1 ? 'task' : 'tasks'}</span>
            </div>
          </section>

          <section className="command-card" aria-labelledby="command-heading">
            <div className="command-header">
              <div className="command-copy">
                <span className="command-icon"><Icon name="sparkles" /></span>
                <div>
                  <p className="section-label">Command console</p>
                  <h2 id="command-heading">{directAudience ? `Private audience · ${selectedAudience.label}` : 'Your continuous command thread'}</h2>
                </div>
              </div>
              {visibleCommandMessages.length > 0 && (
                <button
                  className="new-chat-button"
                  type="button"
                  onClick={() => void startNewChat()}
                  disabled={commandBusy || archiving}
                  title={commandBusy ? `Wait for ${selectedAudience.label} to finish the current reply.` : 'Archive this conversation and open a clean one.'}
                >
                  <span>＋</span>{archiving ? 'Archiving…' : 'New chat'}
                </button>
              )}
            </div>

            <div className="task-modes" aria-label="Task type">
              {taskModes.map((mode) => (
                <button
                  key={mode.id}
                  className={taskType === mode.id ? 'selected' : ''}
                  type="button"
                  onClick={() => { setTaskType(mode.id); setAgentId('') }}
                >
                  <span>{mode.emoji}</span>
                  <strong>{mode.label}</strong>
                  <small>{mode.hint}</small>
                </button>
              ))}
            </div>

            {taskType !== 'build' && (
              <>
                <div className="audience-picker" aria-label="Who should answer">
                  <span>Talk to</span>
                  <div className="audience-options">
                    {audienceOptions.map((option) => {
                      const agent = agents.find((member) => member.id === option.id)
                      return (
                        <button
                          key={option.id}
                          className={audienceAgentId === option.id ? 'selected' : ''}
                          type="button"
                          onClick={() => setAudienceAgentId(option.id)}
                          title={option.id === 'atlas'
                            ? 'Vader reads the request and assigns the useful council.'
                            : option.id === 'muse'
                              ? 'Palpatine answers privately and may consult Luke when first-hand intern context is useful.'
                              : `${option.name} answers directly. No handoff to Vader or the council.`}
                        >
                          <AgentPortrait id={option.id} name={agent?.name || option.name} fallback={agent?.emoji || option.emoji} className="audience-portrait" />
                          <span><strong>{option.label}</strong><small>{option.hint}</small></span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="model-picker">
                  <span>Model</span>
                  <div className="model-modes" aria-label="Model quality">
                    {modelModes.map((mode) => (
                      <button
                        key={mode.id}
                        className={modelMode === mode.id ? 'selected' : ''}
                        type="button"
                        title={mode.hint}
                        onClick={() => setModelMode(mode.id)}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="command-thread" ref={commandThreadRef} aria-live="polite">
                  {visibleCommandMessages.length === 0 && (
                    <div className="command-thread-empty">
                      <span>◉</span>
                      <p>{directAudience
                        ? audienceAgentId === 'muse'
                          ? 'This is your private line to Palpatine. He answers as Luke’s manager and may bring Luke in when first-hand technical or intern context would improve the answer.'
                          : `This is your private line to ${selectedAudience.name}. You will get that agent’s candid view without a council handoff.`
                        : 'Start anywhere. Vader remembers this thread and assigns the smallest useful council for each request.'}</p>
                    </div>
                  )}
                  {visibleCommandMessages.map((message) => (
                    <div className={`command-message ${message.role} ${message.status}`} key={message.id}>
                      {message.role === 'user'
                        ? <span className="command-message-avatar user-avatar">SM</span>
                        : <AgentPortrait id={message.agentId} name={message.agentName} fallback={message.agentEmoji} className="command-message-avatar" />}
                      <div className="command-bubble">
                        <div className="command-message-meta">
                          <strong>{message.role === 'user' ? 'You' : message.agentName || 'Imperial Command'}</strong>
                          {message.role === 'assistant' && <span>{message.audienceAgentId !== 'atlas' ? 'Private audience' : message.mode === 'research' ? 'Research' : 'Answer'}{message.modelUsed ? ` · ${message.modelUsed}` : ''}{message.collaborators.length > 1 ? ` · ${message.collaborators.length} contributors` : ''}</span>}
                        </div>
                        {message.content && <MarkdownContent value={message.content} />}
                        {!message.content && ['queued', 'running'].includes(message.status) && (
                          <p className="thinking-line"><span /> {message.mode === 'research'
                            ? `${message.agentName || selectedAudience.label} is making one bounded research pass…`
                            : `${message.agentName || selectedAudience.label} is considering the useful part…`}</p>
                        )}
                        {message.error && <p className="command-error">{message.error}</p>}
                        {message.sources.length > 0 && (
                          <div className="command-sources">
                            {message.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.title}</a>)}
                          </div>
                        )}
                        {message.role === 'assistant' && (
                          <CouncilContributions
                            ids={message.collaborators}
                            agents={agents}
                            taskType={message.mode}
                            reason={message.teamReason}
                            privateAudience={message.audienceAgentId !== 'atlas'}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {archiveNotice && (
              <p className="chat-archive-notice" role="status">
                <span>✓</span> {archiveNotice} <a href="#tasks">View it in Orders &amp; intelligence</a>
              </p>
            )}

            <form onSubmit={addTask}>
              <label className="sr-only" htmlFor="task-title">Your request</label>
              <textarea
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={600}
                rows={3}
                placeholder={taskType === 'qna'
                  ? visibleCommandMessages.length ? `Continue with ${selectedAudience.label}…` : directAudience ? `Ask ${selectedAudience.label} privately…` : 'Ask anything…'
                  : taskType === 'research'
                    ? directAudience ? `What should ${selectedAudience.label} investigate?` : 'What should Vader investigate across the live web?'
                    : 'What should Grand Moff Tarkin build on your Mac?'}
              />
              <div className="dispatch-row">
                {taskType === 'build' ? (
                  <>
                    <label className="sr-only" htmlFor="task-agent">Assign an agent</label>
                    <select id="task-agent" value={agentId} onChange={(event) => setAgentId(event.target.value)}>
                      <option value="">Auto-assign</option>
                      {agents.filter((agent) => agent.id !== 'luke').map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                    </select>
                  </>
                ) : <span className="memory-grounding">◎ Grounded in your shared profile</span>}
                <button className="primary-button" type="submit" disabled={!title.trim() || saving}>
                  {saving ? 'Transmitting…' : taskType === 'build' ? 'Send one-off build to Mac' : directAudience ? `Ask ${selectedAudience.label}` : 'Send to Vader'}
                </button>
              </div>
            </form>
            <p className="route-note">
              {taskType === 'build'
                ? runnerOnline ? 'Build is a separate one-off order. Your Mac is online, so Tarkin can begin shortly.' : 'Build is separate from chat and waits safely until your Mac wakes.'
                : directAudience
                  ? audienceAgentId === 'muse'
                    ? `${chatRetention}. Palpatine answers privately as Luke’s manager. He may consult Luke for first-hand context; Vader and the wider council stay out.`
                    : `${chatRetention}. ${selectedAudience.name} answers directly with an independent view; Vader and the council are not invoked.`
                : modelMode === 'auto'
                  ? `${chatRetention}. Auto uses the best-value model; Vader assigns the smallest useful council after reading the request.`
                  : `${modelModes.find((mode) => mode.id === modelMode)?.label} uses ${modelModes.find((mode) => mode.id === modelMode)?.hint}. Vader still decides the team, and it runs while your Mac is closed.`}
            </p>
            {error && <p className="error-message" role="alert">{error}</p>}
          </section>

          <section id="profile" className="section-block" aria-labelledby="profile-heading">
            <div className="section-heading profile-heading">
              <div>
                <p className="section-label">Shared grounding</p>
                <h2 id="profile-heading">The Commander profile</h2>
              </div>
              <span>{profileData.nodes.length} live signals</span>
            </div>

            <article className="profile-card">
              <div className="profile-intro">
                <div className="profile-orb">SM</div>
                <div>
                  <p className="section-label">Known, not assumed</p>
                  <h3>{profileData.profile?.displayName || 'Commander'}</h3>
                  <p>{profileData.profile?.summary || 'The council is assembling your grounded working profile.'}</p>
                </div>
              </div>
              <div className="profile-facets">
                <div><span>How you communicate</span><p>{profileData.profile?.communicationStyle}</p></div>
                <div><span>How you decide</span><p>{profileData.profile?.decisionStyle}</p></div>
                <div><span>How we collaborate</span><p>{profileData.profile?.collaborationStyle}</p></div>
              </div>
              <div className="knowledge-topline">
                <div>
                  <p className="section-label">Collaborative knowledge graph</p>
                  <h3>What grounds every answer</h3>
                </div>
                <small>{profileData.nodes.length} memories · {profileData.vectorStatus.pending ? `${profileData.vectorStatus.pending} embedding` : 'semantic index active'}</small>
              </div>
              <div className="knowledge-graph">
                <div className="knowledge-root"><span>SM</span><strong>You</strong><small>source of truth</small></div>
                <div className="knowledge-nodes">
                  {profileData.nodes.map((node) => {
                    const relation = profileData.edges.find((edge) => edge.toNodeId === node.id)?.relation.replaceAll('_', ' ') || node.category
                    return (
                      <article className={`knowledge-node ${node.category}`} key={node.id}>
                        <div className="knowledge-node-top"><span>{relation}</span><strong>{Math.round(node.confidence * 100)}%</strong></div>
                        <h4>{node.label}</h4>
                        <p>{node.description}</p>
                        <div className="knowledge-node-foot">
                          <span>{node.evidenceCount} signal{node.evidenceCount === 1 ? '' : 's'}</span>
                          <div aria-label="Contributing agents">
                            {node.contributedBy.map((id) => {
                              const contributor = agents.find((agent) => agent.id === id)
                              return contributor ? <AgentPortrait id={id} name={contributor.name} fallback={contributor.emoji} className="knowledge-contributor" key={id} /> : null
                            })}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
              {profileData.relationships.length > 0 && (
                <div className="relationship-panel">
                  <div className="relationship-heading">
                    <div>
                      <p className="section-label">Connections that deepen over time</p>
                      <h3>How your signals influence each other</h3>
                    </div>
                    <span>Vectorize finds relevance · D1 keeps the truth</span>
                  </div>
                  <div className="relationship-list">
                    {profileData.relationships.slice(0, 12).map((relationship) => {
                      const from = profileData.nodes.find((node) => node.id === relationship.fromNodeId)
                      const to = profileData.nodes.find((node) => node.id === relationship.toNodeId)
                      if (!from || !to) return null
                      return (
                        <article className="relationship-card" key={`${relationship.fromNodeId}-${relationship.relation}-${relationship.toNodeId}`}>
                          <div className="relationship-path">
                            <strong>{from.label}</strong>
                            <span>{relationship.relation.replaceAll('_', ' ')}</span>
                            <strong>{to.label}</strong>
                          </div>
                          <p>{relationship.rationale}</p>
                          <small>{Math.round(relationship.weight * 100)}% strength · {relationship.evidenceCount} signal{relationship.evidenceCount === 1 ? '' : 's'}</small>
                        </article>
                      )
                    })}
                  </div>
                </div>
              )}
              <p className="profile-policy">{profileData.policy || 'Observed preferences only.'} Tell the chat when something is wrong; explicit corrections outrank old signals.</p>
            </article>
          </section>

          <section id="schedules" className="section-block" aria-labelledby="schedules-heading">
            <div className="section-heading schedule-heading">
              <div>
                <p className="section-label">Cloud watch</p>
                <h2 id="schedules-heading">Scheduled missions</h2>
              </div>
              <button className="secondary-button" type="button" onClick={() => setShowScheduleForm((open) => !open)}>
                {showScheduleForm ? 'Close' : '+ New schedule'}
              </button>
            </div>

            <article className="alert-card">
              <div className="alert-copy">
                <span className="alert-icon">✉</span>
                <div>
                  <h3>Vader completion alerts</h3>
                  <p>One crisp email when any scheduled or one-off mission finishes or needs attention.</p>
                </div>
              </div>
              <form onSubmit={saveNotificationEmail}>
                <label className="sr-only" htmlFor="notification-email">Notification email</label>
                <input id="notification-email" type="email" value={notificationEmail} onChange={(event) => setNotificationEmail(event.target.value)} placeholder="you@example.com" />
                <button className="small-button" disabled={settingsSaving} type="submit">{settingsSaving ? 'Saving…' : 'Save'}</button>
              </form>
              <p className={`email-state ${settings.emailConnected && settings.notificationEmail ? 'connected' : ''}`}>
                {settings.emailConnected && settings.notificationEmail
                  ? '● Alerts armed'
                  : settings.notificationEmail
                    ? '○ Recipient saved · sender connection remains'
                    : '○ Add an address to queue alerts'}
              </p>
            </article>

            {showScheduleForm && (
              <form className="schedule-form" onSubmit={createSchedule}>
                <div className="schedule-form-intro">
                  <p className="section-label">New standing order</p>
                  <h3>What should the council watch?</h3>
                  <p>Vader decides the handoffs at run time. Every handoff appears on the Comms Board.</p>
                </div>
                <label>
                  <span>Mission name</span>
                  <input value={scheduleName} maxLength={120} onChange={(event) => setScheduleName(event.target.value)} placeholder="Watch BOS → LHR fares" required />
                </label>
                <label className="wide-field">
                  <span>Standing instructions</span>
                  <textarea value={schedulePrompt} maxLength={1200} rows={4} onChange={(event) => setSchedulePrompt(event.target.value)} placeholder="Find the best nonstop options for my dates, compare meaningful price changes, and tell me only when something is worth acting on." required />
                </label>
                <div className="schedule-options">
                  <label><span>Frequency</span><select value={scheduleCadence} onChange={(event) => setScheduleCadence(event.target.value as 'daily' | 'twice_daily')}><option value="daily">Once a day</option><option value="twice_daily">Twice a day</option></select></label>
                  <label><span>First run · ET</span><input type="time" value={scheduleTimeOne} onChange={(event) => setScheduleTimeOne(event.target.value)} /></label>
                  {scheduleCadence === 'twice_daily' && <label><span>Second run · ET</span><input type="time" value={scheduleTimeTwo} onChange={(event) => setScheduleTimeTwo(event.target.value)} /></label>}
                  <label><span>Mission type</span><select value={scheduleType} onChange={(event) => setScheduleType(event.target.value as 'qna' | 'research')}><option value="research">Live research</option><option value="qna">Q&amp;A / analysis</option></select></label>
                  <label><span>Model</span><select value={scheduleModel} onChange={(event) => setScheduleModel(event.target.value as ModelMode)}>{modelModes.map((mode) => <option value={mode.id} key={mode.id}>{mode.label} · {mode.hint}</option>)}</select></label>
                </div>
                <fieldset>
                  <legend>Available council</legend>
                  <div className="team-picker">
                    {agents.filter((agent) => agent.id !== 'luke').map((agent) => (
                      <button key={agent.id} type="button" className={scheduleTeam.includes(agent.id) ? 'selected' : ''} onClick={() => toggleTeamMember(agent.id)} aria-pressed={scheduleTeam.includes(agent.id)}>
                        <AgentPortrait id={agent.id} name={agent.name} fallback={agent.emoji} className="team-portrait" /><strong>{agent.name.replace('Grand Moff ', '').replace('Emperor ', '').replace('Darth ', '')}</strong>{agent.id === 'atlas' && <small>Manager</small>}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="recruit-toggle"><input type="checkbox" checked={allowRecruits} onChange={(event) => setAllowRecruits(event.target.checked)} /><span><strong>Let agents recruit help</strong><small>They may bring in another council member and notify Vader on the Comms Board.</small></span></label>
                <button className="primary-button wide-field" type="submit" disabled={scheduleSaving || !scheduleName.trim() || !schedulePrompt.trim()}>{scheduleSaving ? 'Authorizing…' : 'Authorize schedule'}</button>
              </form>
            )}

            <div className="schedule-list">
              {schedules.length === 0 && !showScheduleForm && <div className="schedule-empty"><span>◴</span><h3>No standing orders yet</h3><p>Create one for flights, prices, news, or anything worth checking without opening your Mac.</p></div>}
              {schedules.map((schedule) => (
                <article className={`schedule-card ${schedule.enabled ? '' : 'paused'}`} key={schedule.id}>
                  <div className="schedule-card-top">
                    <div><span className={`schedule-status ${schedule.enabled ? 'active' : ''}`}>{schedule.enabled ? '● Active' : 'Paused'}</span><h3>{schedule.name}</h3></div>
                    <span className="cadence-chip">{schedule.cadence === 'daily' ? 'Daily' : 'Twice daily'}</span>
                  </div>
                  <p>{schedule.prompt}</p>
                  <div className="schedule-meta"><span>◴ {schedule.timeOne}{schedule.timeTwo ? ` & ${schedule.timeTwo}` : ''} ET</span><span>{schedule.taskType === 'research' ? '⌕ Live research' : '◇ Q&A'}</span><span>{schedule.modelMode === 'auto' ? 'Auto model' : schedule.modelMode}</span></div>
                  <div className="schedule-team" aria-label="Available mission team">
                    {schedule.teamAgents.map((id) => { const member = agents.find((agent) => agent.id === id); return member ? <AgentPortrait id={id} name={member.name} fallback={member.emoji} className="schedule-portrait" key={id} /> : null })}
                    {schedule.allowRecruits ? <small>+ recruits allowed</small> : <small>fixed roster</small>}
                  </div>
                  <div className="schedule-footer">
                    <span>{schedule.lastTaskStatus ? `Last run: ${schedule.lastTaskStatus}` : 'Awaiting first run'}</span>
                    <div>
                      <button type="button" onClick={() => void updateSchedule(schedule, 'run')} disabled={scheduleBusy === schedule.id || !schedule.enabled}>Run now</button>
                      <button type="button" onClick={() => void updateSchedule(schedule, 'toggle')} disabled={scheduleBusy === schedule.id}>{schedule.enabled ? 'Pause' : 'Resume'}</button>
                      <button className="danger-link" type="button" onClick={() => void updateSchedule(schedule, 'delete')} disabled={scheduleBusy === schedule.id}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="workshop" className="section-block" aria-labelledby="workshop-heading">
            <div className="section-heading workshop-heading">
              <div>
                <p className="section-label">Controlled R&amp;D</p>
                <h2 id="workshop-heading">Luke’s Workshop</h2>
              </div>
              <span>2 rotations a week</span>
            </div>

            <article className="workshop-intro">
              <div className="workshop-intern">
                <AgentPortrait id="luke" name="Luke Skywalker" fallback="⌘" className="workshop-avatar" />
                <div>
                  <p className="section-label">Rotating software intern</p>
                  <h3>Curious enough to ask. Guarded enough to wait.</h3>
                  <p>Luke reports to Palpatine, listens for recurring friction in tasks and the watercooler, then proposes one small, testable capability at a time.</p>
                </div>
              </div>
              <div className="workshop-guardrails">
                <div><strong>Luke plans</strong><span>Sol · {workshopData.rotationSchedule}</span></div>
                <div><strong>Palpatine reviews</strong><span>Approve or revise before you see it</span></div>
                <div><strong>Build</strong><span>Luna · isolated Mac worktree</span></div>
                <div><strong>Release</strong><span>Separate approval · health check · rollback</span></div>
              </div>
              <p className="workshop-policy">{workshopData.policy || 'Build and deploy always require separate approval.'}</p>
            </article>

            <div className="proposal-list" aria-live="polite">
              {workshopData.proposals.length === 0 && (
                <article className="workshop-empty">
                  <AgentPortrait id="luke" name="Luke Skywalker" fallback="⌘" className="workshop-empty-avatar" />
                  <div><h3>First rotation is assembling</h3><p>Luke’s proposal will appear after the next Tuesday or Friday 10:30 AM ET rotation. Nothing builds automatically.</p></div>
                </article>
              )}
              {workshopData.proposals.map((proposal) => {
                const canBuild = ['proposed', 'failed', 'blocked'].includes(proposal.status)
                const canDeploy = proposal.status === 'awaiting_deploy'
                const canReject = ['proposed', 'build_approved', 'awaiting_deploy', 'failed', 'blocked'].includes(proposal.status)
                const relatedEvents = workshopData.events.filter((event) => event.proposalId === proposal.id).slice(0, 4)
                return (
                  <article className={`proposal-card ${proposal.status}`} key={proposal.id}>
                    <div className="proposal-topline">
                      <div>
                        <span className={`proposal-status ${proposal.status}`}>{improvementStatusLabel(proposal.status)}</span>
                        <h3>{proposal.title}</h3>
                      </div>
                      <span className={`risk-chip ${proposal.riskLevel}`}>{proposal.riskLevel} risk</span>
                    </div>
                    {proposal.managerReview && (
                      <div className={`manager-review ${proposal.managerDecision}`}>
                        <div className="manager-review-portraits">
                          <AgentPortrait id="luke" name="Luke Skywalker" fallback="⌘" className="proposal-portrait" />
                          <span>→</span>
                          <AgentPortrait id="muse" name="Emperor Palpatine" fallback="✦" className="proposal-portrait" />
                        </div>
                        <div>
                          <strong>Palpatine {proposal.managerDecision === 'revised' ? 'revised & cleared' : 'approved'} this first</strong>
                          <p>{proposal.managerReview}</p>
                          <small>{proposal.managerModel} · now awaiting your decision</small>
                        </div>
                      </div>
                    )}
                    <div className="proposal-copy">
                      <div><strong>Friction</strong><p>{proposal.problem}</p></div>
                      <div><strong>Smallest useful change</strong><p>{proposal.proposal}</p></div>
                      <div><strong>Why it earns a place</strong><p>{proposal.benefit}</p></div>
                    </div>
                    <div className="proposal-agents">
                      <span>Requested / affected</span>
                      <div>{[...new Set([...proposal.requestedBy, ...proposal.affectedAgents])].map((id) => { const member = agents.find((agent) => agent.id === id); return member ? <AgentPortrait id={id} name={member.name} fallback={member.emoji} className="proposal-portrait" key={id} /> : null })}</div>
                    </div>
                    <details className="proposal-details">
                      <summary>Plan, tests &amp; cost</summary>
                      <div className="proposal-detail-grid">
                        <div><strong>Acceptance checks</strong><ul>{proposal.acceptanceTests.map((test) => <li key={test}>{test}</li>)}</ul></div>
                        <div><strong>Granted lane</strong><ul>{proposal.permissions.map((permission) => <li key={permission}>{permission}</li>)}</ul></div>
                      </div>
                      <p><strong>Cost:</strong> {proposal.estimatedCost}</p>
                      <p><strong>Models:</strong> {proposal.planModel} plans · {proposal.actionModel} acts</p>
                      {(proposal.buildSummary || proposal.buildError) && <div className="workshop-result"><strong>Build evidence</strong><MarkdownContent value={proposal.buildSummary || proposal.buildError || ''} /></div>}
                      {(proposal.deploySummary || proposal.deployError) && <div className="workshop-result"><strong>Release evidence</strong><MarkdownContent value={proposal.deploySummary || proposal.deployError || ''} /></div>}
                      {relatedEvents.length > 0 && <div className="workshop-events">{relatedEvents.map((event) => <p key={event.id}><span>{event.actor}</span>{event.detail}</p>)}</div>}
                    </details>
                    {(canBuild || canDeploy || canReject) && (
                      <div className="proposal-actions">
                        {canBuild && <button className="primary-button" type="button" disabled={workshopBusy === proposal.id || !runnerOnline} onClick={() => void updateWorkshop(proposal, 'approve_build')}>{proposal.status === 'proposed' ? 'Approve isolated build' : 'Retry isolated build'}</button>}
                        {canDeploy && <button className="primary-button deploy-button" type="button" disabled={workshopBusy === proposal.id || !runnerOnline} onClick={() => void updateWorkshop(proposal, 'approve_deploy')}>Approve deployment</button>}
                        {canReject && <button className="proposal-reject" type="button" disabled={workshopBusy === proposal.id} onClick={() => void updateWorkshop(proposal, 'reject')}>Decline</button>}
                        {!runnerOnline && (canBuild || canDeploy) && <small>Mac runner must be online to continue.</small>}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            <div className="capability-panel">
              <div><p className="section-label">Office skill tree</p><h3>Capabilities currently in service</h3></div>
              <div className="capability-list">
                {workshopData.capabilities.map((capability) => (
                  <article key={capability.id}><span>{capability.kind}</span><strong>{capability.name}</strong><p>{capability.description}</p><small>{capability.ownerAgentName || 'Council'} · {capability.status}</small></article>
                ))}
              </div>
            </div>
          </section>

          <section id="comms" className="section-block" aria-labelledby="comms-heading">
            <div className="section-heading comms-heading">
              <div>
                <p className="section-label">The Death Star breakroom</p>
                <h2 id="comms-heading">Imperial Comms Board</h2>
              </div>
              <span>Free handoffs · live Qwen chat</span>
            </div>

            <div className="comms-grid">
              <article className="sprint-card">
                <div className="sprint-topline">
                  <AgentPortrait id="atlas" name="Darth Vader" className="comms-avatar vader" />
                  <div>
                    <p className="section-label">Vader's daily sprint</p>
                    <h3>Command review</h3>
                  </div>
                  <span className="live-chip">{reviewSchedule}</span>
                </div>
                <div className="sprint-copy">
                  {latestSprint
                    ? <MarkdownContent value={latestSprint.message} />
                    : 'The first review is assembling. The lack of panic is noted.'}
                </div>
                <p className="cost-note">One compact Luna call each morning. Mission handoffs remain deterministic and use no model tokens.</p>
              </article>

              <article className="leadership-card">
                <div className="sprint-topline">
                  <AgentPortrait id="atlas" name="Darth Vader" className="comms-avatar vader" />
                  <div>
                    <p className="section-label">Leadership chain</p>
                    <h3>People, training & morale</h3>
                  </div>
                  <span className="live-chip">Weekdays</span>
                </div>
                <div className="leadership-list">
                  {leadershipEvents.length === 0 && <p className="quiet-feed">The first leadership action is being scheduled.</p>}
                  {leadershipEvents.slice(0, 5).map((event) => (
                    <div className="leadership-event" key={event.id}>
                      <div className="leadership-chain">
                        <AgentPortrait id={event.leaderAgentId || 'atlas'} name={event.leaderAgentName || 'Darth Vader'} fallback={event.leaderAgentEmoji || '◉'} className="leadership-portrait" />
                        {event.agentId
                          ? <AgentPortrait id={event.agentId} name={event.agentName || 'Council member'} fallback={event.agentEmoji || '○'} className="leadership-portrait" />
                          : <span className="leadership-team-mark">◎</span>}
                      </div>
                      <div className="leadership-event-copy">
                        <span>{event.kind.replaceAll('_', ' ')}</span>
                        <strong>{event.title}</strong>
                        <MarkdownContent value={event.message} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="cost-note">Vader manages Fett, Tarkin, and Palpatine. Palpatine manages Luke and reports his development upward. The rotating 1:1s and manager syncs add no model cost.</p>
              </article>

              <article className="performance-card">
                <div className="sprint-topline">
                  <AgentPortrait id="atlas" name="Darth Vader" className="comms-avatar vader" />
                  <div>
                    <p className="section-label">Vader's council review</p>
                    <h3>Performance & development</h3>
                  </div>
                  <span className="live-chip">
                    {nextPerformanceReviewAt ? `Next ${formatReviewDate(nextPerformanceReviewAt)}` : 'Every 14 days'}
                  </span>
                </div>
                {performanceReview ? (
                  <>
                    <p className="review-period">Review window · {formatReviewDay(performanceReview.periodStart)}–{formatReviewDay(performanceReview.periodEnd)}</p>
                    <MarkdownContent value={performanceReview.report} className="performance-copy" />
                    <div className="performance-metrics" aria-label="Fortnightly agent performance metrics">
                      {performanceReview.metrics.map((metric) => (
                        <div className="performance-metric" key={metric.agentId}>
                          <AgentPortrait id={metric.agentId} name={metric.name} className="leadership-portrait" />
                          <span><strong>{metric.name.replace('Grand Moff ', '').replace('Emperor ', '').replace('Darth ', '')}</strong><small>{metric.completed}/{metric.assignments} complete · {metric.handoffsGiven} returns · {metric.failed} failed</small></span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="quiet-feed">The first two-week baseline review is assembling from real task and handoff data.</p>
                )}
                <p className="cost-note">Generated from real assignments and handoffs every 14 days with no model cost. Low task volume is treated as a workload signal, never poor performance.</p>
              </article>

              <article className="watercooler-card live-chat-card" aria-live="polite">
                <div className="watercooler-title">
                  <div>
                    <p className="section-label">Open channel</p>
                    <h3>Watercooler live</h3>
                  </div>
                  <span className="qwen-chip">{chatSchedule}</span>
                </div>
                {socialStates.length > 0 && (
                  <div className="social-strip" aria-label="Current agent moods">
                    {socialStates.map((state) => (
                      <div className="social-state" key={state.agentId} title={state.lastTopic || state.activity}>
                        <AgentPortrait id={state.agentId} name={state.agentName} fallback={state.agentEmoji} className="social-portrait" />
                        <span><strong>{state.agentName.replace('Grand Moff ', '').replace('Emperor ', '').replace('Darth ', '')}</strong><small>{state.mood} · {state.activity}</small></span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="chat-stream" ref={chatStreamRef}>
                  {chat.length === 0 && <p className="quiet-feed">The channel is quiet. This will not last.</p>}
                  {chat.map((entry) => (
                    <div className={`chat-message ${entry.turnIndex % 2 === 1 ? 'reply' : ''} ${Boolean(entry.continuity) && entry.turnIndex === 0 ? 'continued' : ''}`} key={entry.id}>
                      <AgentPortrait id={entry.speakerId} name={entry.speakerName} fallback={entry.speakerEmoji} className="comms-avatar" />
                      <div className="chat-bubble">
                        <div className="chat-meta">
                          <strong>{entry.speakerName}</strong>
                          <span>to {entry.recipientName}</span>
                          {Boolean(entry.continuity) && entry.turnIndex === 0 && <span className="continuity-chip">continuing thread</span>}
                          <time>{new Date(`${entry.createdAt}Z`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
                        </div>
                        {entry.turnIndex === 0 && entry.contextTitle && (
                          entry.contextUrl
                            ? <a className={`chat-context ${entry.contextKind}`} href={entry.contextUrl} target="_blank" rel="noreferrer"><span>{entry.contextKind === 'news' ? 'World pulse' : entry.contextKind === 'holiday' ? 'Global observance' : 'Office life'}</span>{entry.contextTitle}<small>{entry.contextSource}</small></a>
                            : <span className={`chat-context ${entry.contextKind}`}><span>{entry.contextKind === 'news' ? 'World pulse' : entry.contextKind === 'holiday' ? 'Global observance' : 'Office life'}</span>{entry.contextTitle}<small>{entry.contextSource}</small></span>
                        )}
                        <MarkdownContent value={entry.message} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="cost-note">Natural 2–4 line bursts now carry open threads forward, vary who joins, and reject near-repeated phrasing. News stays cached; chat still clears nightly.</p>
              </article>
            </div>

            <article className="handoff-card" aria-live="polite">
              <div className="watercooler-title">
                <div>
                  <p className="section-label">Mission traffic</p>
                  <h3>Handoffs & returns</h3>
                </div>
                <span>{handoffs.length} today · no AI cost</span>
              </div>
              <div className="handoff-list">
                {handoffs.length === 0 && <p className="quiet-feed">No active handoffs. The paperwork is enjoying a brief victory.</p>}
                {handoffs.map((entry) => (
                  <div className={`feed-entry ${entry.kind}`} key={entry.id}>
                    <AgentPortrait id={entry.speakerId} name={entry.speakerName} fallback={entry.speakerEmoji} className="comms-avatar" />
                    <div>
                      <div className="feed-meta">
                        <strong>{entry.speakerName}</strong>
                        {entry.recipientName && <span>→ {entry.recipientName}</span>}
                        <small>{entry.kind}</small>
                      </div>
                      <MarkdownContent value={entry.message} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {bonds.length > 0 && (
              <div className="bond-row" aria-label="Agent dynamics">
                {bonds.map((bond) => (
                  <article className="bond-card" key={`${bond.agentAId}-${bond.agentBId}`}>
                    <div className="bond-pair">
                      <AgentPortrait id={bond.agentAId} name={bond.agentAName} fallback={bond.agentAEmoji} className="bond-portrait" /><AgentPortrait id={bond.agentBId} name={bond.agentBName} fallback={bond.agentBEmoji} className="bond-portrait" />
                      <strong>{bond.agentAName} × {bond.agentBName}</strong>
                    </div>
                    <p>{bond.quirk}</p>
                    <small>{bond.handoffs} handoff{bond.handoffs === 1 ? '' : 's'} · rapport {bond.rapport}/12</small>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="tasks" className="section-block task-section" aria-labelledby="tasks-heading">
            <div className="section-heading">
              <div>
                <p className="section-label">Imperial transmissions</p>
                <h2 id="tasks-heading">Orders & intelligence</h2>
              </div>
              <span>{openTaskCount} open</span>
            </div>

            <div className="task-list" aria-live="polite">
              {!loading && tasks.length === 0 && (
                <div className="empty-state">
                  <span><Icon name="tasks" /></span>
                  <h3>The command deck is clear</h3>
                  <p>Issue an order above and Lord Vader will answer it here.</p>
                </div>
              )}
              {tasks.map((task, index) => (
                <article className={`task-row ${task.executionStatus}`} key={task.id}>
                  <div className="task-topline">
                    <AgentPortrait id={task.agentId} name={task.agentName || 'Unassigned'} fallback={task.agentEmoji || '○'} className="task-agent" />
                    <div className="task-copy">
                      <div className="task-badges">
                        <span>{task.taskType === 'qna' ? 'Q&A' : task.taskType}</span>
                        <span>{task.executionTarget === 'cloud' ? '☁ Cloud' : '⌘ Mac'}</span>
                        <span>{task.modelUsed || (task.executionTarget === 'mac' ? 'Codex' : task.modelMode)}</span>
                        {task.archiveKey && <span className="archive-task-badge">↗ Archived chat</span>}
                        {task.scheduleName && <span className="schedule-task-badge">◴ {task.scheduleName}</span>}
                        <span className={`run-status ${task.executionStatus}`}>{statusLabel(task)}</span>
                      </div>
                      <h3>{task.title}</h3>
                      <p>{task.agentName ? `${task.agentName} · ${new Date(`${task.createdAt}Z`).toLocaleString()}` : 'Waiting for an agent'}</p>
                      {task.collaborators.length > 1 && <div className="task-collaborators">Council: {task.collaborators.map((id) => { const member = agents.find((agent) => agent.id === id); return member ? <AgentPortrait id={id} name={member.name} fallback={member.emoji} className="collaborator-portrait" key={id} /> : null })}</div>}
                    </div>
                  </div>

                  {(task.result || task.error) && (
                    <details className="task-result" open={index === 0 && task.executionStatus === 'complete'}>
                      <summary>{task.error ? 'View issue' : 'View answer'}</summary>
                      {task.error
                        ? <p className="task-error">{task.error}</p>
                        : <MarkdownContent value={task.result || ''} className="result-copy" />}
                      {!task.error && (
                        <CouncilContributions
                          ids={task.collaborators}
                          agents={agents}
                          taskType={task.taskType}
                        />
                      )}
                      {task.routeReason && <p className="route-reason">{task.routeReason}</p>}
                      {task.sources.length > 0 && (
                        <div className="source-list">
                          <strong>Sources</strong>
                          {task.sources.map((source) => (
                            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                          ))}
                        </div>
                      )}
                      {task.executionStatus === 'failed' && (
                        <button className="retry-button" type="button" onClick={() => void retryTask(task.id)} disabled={retrying === task.id}>
                          {retrying === task.id ? 'Retrying…' : 'Retry task'}
                        </button>
                      )}
                    </details>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section id="team" className="section-block" aria-labelledby="team-heading">
            <div className="section-heading">
              <div>
                <p className="section-label">The inner circle</p>
                <h2 id="team-heading">Dark Council</h2>
              </div>
              <span>{agents.length || 5} agents</span>
            </div>
            <div className="agent-grid" aria-busy={loading}>
              {loading && Array.from({ length: 5 }, (_, index) => <div className="agent-card skeleton" key={index} />)}
              {!loading && agents.map((agent) => (
                <article className="agent-card" key={agent.id} style={{ '--agent-color': agent.color } as CSSProperties}>
                  <div className="agent-topline">
                    <AgentPortrait id={agent.id} name={agent.name} fallback={agent.emoji} className="agent-emoji" />
                    <span className={`status ${agent.status}`}><span /> {agent.status}</span>
                  </div>
                  <h3>{agent.name}</h3>
                  <p className="agent-role">{agent.role}</p>
                  <p className="agent-personality">{agent.personality}</p>
                </article>
              ))}
            </div>
          </section>

          <footer>Imperial Command · Cloud intelligence, Mac firepower</footer>
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        <a className="active" href="#top"><Icon name="home" /><span>Overview</span></a>
        <a href="#profile"><Icon name="team" /><span>Profile</span></a>
        <a href="#schedules"><Icon name="tasks" /><span>Schedule</span></a>
        <a href="#workshop"><Icon name="sparkles" /><span>Workshop</span></a>
        <a href="#comms"><Icon name="sparkles" /><span>Comms</span></a>
        <a href="#tasks"><Icon name="tasks" /><span>Tasks</span></a>
      </nav>
    </div>
  )
}

export default App
