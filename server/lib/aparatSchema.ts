import { z } from 'zod'

const text = z.string().nullish()
const scalar = z.union([z.string(), z.number()]).nullish()

const resource = z.looseObject({
  type: z.string(),
  attributes: z.record(z.string(), z.unknown()).nullish(),
})

export const aparatDocument = z.looseObject({
  data: z.union([resource, z.array(resource)]).nullish(),
  included: z.array(resource).nullish(),
})

export const aparatList = z.looseObject({
  link: z.looseObject({ next: text }).nullish(),
})

export const aparatChannel = z.looseObject({
  username: text,
  name: text,
  displayName: text,
  avatar: text,
  follower_cnt: scalar,
})

export const aparatVideo = z.looseObject({
  uid: z.string().regex(/^[\w-]+$/),
  title: z.string(),
  description: text,
  duration: scalar,
  visit_cnt: scalar,
  visit_cnt_int: scalar,
  visit_cnt_non_formatted: scalar,
  like_cnt: scalar,
  like_cnt_non_formatted: scalar,
  sdate: text,
  sdate_real: text,
  sdate_rss: text,
  mdate: text,
  sender_name: text,
  owner_username: text,
  profilePhoto: text,
  deleted: text,
  big_poster: text,
  medium_poster: text,
  small_poster: text,
  frame: text,
  frame_src: text,
  tags: z.array(z.unknown()).nullish(),
  file_link_all: z.array(z.unknown()).nullish(),
})

export type AparatDocument = z.infer<typeof aparatDocument>
export type AparatChannel = z.infer<typeof aparatChannel>
export type AparatVideo = z.infer<typeof aparatVideo>

export function describeIssues(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ')
}
