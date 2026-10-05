export interface VideoSummary {
  uid: string
  title: string
  posterUrl: string
  durationSeconds: number
  visitCount: number
  publishedAtLabel: string
}

export interface VideoDetail extends VideoSummary {
  description: string
  senderName: string
}

export interface VideoPage {
  items: VideoSummary[]
  page: number
  perPage: number
  totalCount: number
}
