export default defineEventHandler((event) => {
  const query = getQuery(event)

  return fetchChannelPage({
    q: typeof query.q === 'string' ? query.q : '',
    page: numberQuery(query.page),
    perPage: numberQuery(query.perPage),
  })
})

function numberQuery(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
