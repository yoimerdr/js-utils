import {UriQueryParam} from "../helpers/utils";

export interface BloggerOptions {
  feedUri: string,
  blogUrl: string,
  fetch: BloggerFetchOptions
}

interface BloggerFetchOptions {
  params: UriQueryParam[]
}

export interface Blog<Ty> {
  entries: Ty[],
  total: number
}

export interface BlogCollection {
  feed: BlogFeedCollection
}
export interface PostCollection {
  category: PostCollectionCategory[],
  updated: $TCollection,
  published: $TCollection,
  media$thumbnail: PostCollectionThumbnail,
  title: $TCollection,
  link: PostCollectionLink[]
}

export interface $TCollection {
  $t: string
}

export interface PostCollectionLink {
  rel: string,
  href: string,
  title: string
}

export interface PostCollectionThumbnail {
  url: string
}

export interface PostCollectionCategory {
  term: string
}

export interface BlogFeedCollection {
  entry: PostCollection[],
  openSearch$totalResults: $TCollection
}

export type BloggerPageType = "page" | "item"
