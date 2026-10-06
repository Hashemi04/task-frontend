export interface VideoSummary {
  uid: string
  title: string
  posterUrl: string
  durationSeconds: number
  visitCount: number
  publishedAtLabel: string
  senderName: string
  profilePhotoUrl: string
}

export interface VideoDetail extends VideoSummary {
  description: string
  likeCount: number
  followerCount: number
  tags: string[]
  playbackUrl: string
}

export interface VideoPage {
  items: VideoSummary[]
  page: number
  perPage: number
  totalCount: number
}
