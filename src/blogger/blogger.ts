import {
  Blog, BlogCollection,
  BloggerOptions,
  BloggerPageType, PostCollection
} from "../definitions/blogger/blogger";
import {UriQueryParameters} from "../helpers/uri";
import {BlogPost} from "./post";
import {Nullable, UriQueryParam} from "../definitions/helpers/utils";

export class Blogger {
  static typeOf(uri: string): BloggerPageType {
    return Object.orDefault(uri, "").endsWith(".html") ? "item" : "page";
  }

  static assignDefaultOptions(options: BloggerOptions) {
    Object.assignIfNotPresent(options, {
      feedUri: "/feeds/posts/summary/",
      blogUrl: "/",
      fetch: {
        params: []
      }
    });
  }

  static async fetchFeed(options?: BloggerOptions): Promise<Blog<BlogPost>> {
    const config = Object.orDefault(options, {} as BloggerOptions);
    Blogger.assignDefaultOptions(config);
    const queryParams = UriQueryParameters.from(config.feedUri)
      .extend([
        {
          key: "alt",
          value: "json"
        }
      ])
      .extend(config.fetch.params);

    const uri = queryParams.buildUri();

    const response = await fetch(uri, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    const body: BlogCollection = await response.json();
    return {
      entries: Object.orDefault(body.feed.entry, []).map((it: PostCollection) => BlogPost.fromCollection(it)),
      total: parseInt(body.feed.openSearch$totalResults.$t)
    };
  }
}

export class BloggerQueryParamsBuilder {
  static labelSearch(labels: string[]): Nullable<UriQueryParam> {
    labels = Object.orDefault(labels, []);

    return labels.isEmpty() ? undefined : {
      key: "q",
      value: `label:"${labels.join('" | label:"')}"`
    };
  }

  static maxResult(max: number | string): UriQueryParam {
    return {
      key: "max-results",
      value: `${max}`
    }
  }
}