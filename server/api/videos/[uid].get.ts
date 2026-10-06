export default defineEventHandler(async (event) => {
  const uid = getRouterParam(event, 'uid') ?? ''
  const detail = await fetchVideoDetail(uid)

  if (!detail) {
    throw createError({
      statusCode: 404,
      message: 'ویدیو پیدا نشد',
    })
  }

  return detail
})
