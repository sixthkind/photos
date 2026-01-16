/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("favorites")
  } catch (error) {
    return
  }

  return app.delete(collection)
}, (app) => {
  // no-op: collection is not recreated
})
