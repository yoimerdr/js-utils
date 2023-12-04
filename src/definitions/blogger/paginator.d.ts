import {BloggerOptions} from "./blogger";
import {PagePaginatorOptions } from "../helpers/paginator";
import {Nullable} from "../helpers/utils";

export interface BlogPaginatorOptions extends PagePaginatorOptions {
  currentPage: string,
  searchPath: string,
  searchLabelPath: string,
  postsContainerSelector: string,
  afterFetchContent<Ty>(posts: Ty[]): void,
  beforeFetchContent(): void,
  getPostsContainer(): Nullable<Element>,
  blogger: BloggerOptions
}
