export interface BlogPostConfig {
  targetUrlRel: string,
  collectionThumbnailSize: string
  thumbnailSize: string,
  emptyThumbnail: string,
  current: CurrentBlogPostConfig
}

export interface CurrentBlogPostConfig {
  labelsSelector: string,
  labelComponent: string
}

export interface RelatedPostOptions {
  containerId: string,
  itemClass: string,
  thumbnailClass: string,
  titleClass: string,
  categoryInCommon: string,
  categoriesInCommon: string,
  maxRelatedItems: number,
  afterFetch<Ty>(content: Ty[]): void
}