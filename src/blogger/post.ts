import {BlogPostConfig, RelatedPostOptions} from "../definitions/blogger/post";
import {BloggerOptions, PostCollection, PostCollectionLink} from "../definitions/blogger/blogger";
import {Nullable} from "../definitions/helpers/utils";
import {Blogger, BloggerQueryParamsBuilder} from "./blogger";

export class BlogPost {

  title: string = "";
  labels: string[] = [];
  url: string = "/";
  updated: string = "";
  published: string = "";
  private _thumbnail: string = "";

  static config: BlogPostConfig = {
    targetUrlRel: "alternate",
    collectionThumbnailSize: "s72-c",
    thumbnailSize: "w385-h185-p-k-no-nu",
    emptyThumbnail: "",
    current: {
      labelComponent: "label/",
      labelsSelector: "a[rel=tag]"
    }
  }

  private constructor() {}

  static assignDefaultOptions(options: BlogPostConfig) {
    Object.assignIfNotPresent(options, {
      targetUrlRel: "alternate",
      collectionThumbnailSize: "s72-c",
      thumbnailSize: "w385-h185-p-k-no-nu",
      emptyThumbnail: "",
      current: {
        labelComponent: "label/",
        labelsSelector: "a[rel=tag]"
      }
    });
  }

  getThumbnail(size?: string, defaultSize?: string) {
    defaultSize = Object.orDefault(defaultSize, BlogPost.config.collectionThumbnailSize);
    size = Object.orDefault(size, BlogPost.config.thumbnailSize);

    let thumb =  this._thumbnail.replace(`/${defaultSize}/`, `/${size}/`);
    if(thumb === this._thumbnail)
      thumb = this._thumbnail.replace(`=${defaultSize}`, `=${size}`);

    return thumb;
  }
  howManyLabels(labels: string[]) {
    return this.labels.filter(it => labels.includes(it)).length
  }

  static fromCollection(collection: PostCollection) {
    const { updated, category, media$thumbnail, title, link, published } = collection;

    const post = new BlogPost();

    // map labels
    if(category)
      post.labels = category.map(it => decodeURIComponent(it.term || ""));

    // map target values
    post.updated = updated.$t;
    post.published = published.$t;
    post.title = title.$t;

    // check for default
    post._thumbnail = Object.orDefault(media$thumbnail.url, this.config.emptyThumbnail);

    // map url value
    const target: Nullable<PostCollectionLink> = link.find(it => it.rel === this.config.targetUrlRel);
    if(target)
      post.url = Object.orDefault(target.href, "/");

    return post;
  }

  static fromCurrentPage() {
    if(typeof document === "undefined")
      return new BlogPost();

    BlogPost.assignDefaultOptions(BlogPost.config);
    return BlogPost.fromCollection({
      // map categories (blog labels)
      category: Array.from(document!.querySelectorAll(BlogPost.config.current.labelsSelector)).map(it  => {
        const url = (it as HTMLAnchorElement).href.split(BlogPost.config.current.labelComponent);

        // a label as request response category item
        let label = {
          term: "/"
        }
        // check valid split
        if (url.length === 1)
          return label;

        // check if url has ?
        const find = url[1].indexOf("?");
        if(find === -1)
          label.term = url[1];
        else label.term = url[1].substring(0, find);

        return label;
      }),
      media$thumbnail: {
        url: "/"
      },
      link: [
        {
          rel: BlogPost.config.targetUrlRel,
          href: ((document.querySelector("link[rel=canonical]")) as HTMLAnchorElement).href,
          title: document.title
        }
      ],
      updated: {
        $t: ""
      },
      published: {
        $t: ""
      },
      title: {
        $t: document.title
      }
    });
  }
}


export class RelatedPost {
  readonly count: number = 0;

  constructor(
    public post: BlogPost,
    currentPost: BlogPost
  ) {
    if(post.url !== currentPost.url)
      this.count = post.howManyLabels(currentPost.labels)
  }

  private _categoriesInCommon(options: RelatedPostOptions) {
    return `${this.count} ` + (this.count === 1 ? options.categoryInCommon : options.categoriesInCommon).trim();
  }

  static assignDefaultOptions(options: RelatedPostOptions) {
    Object.assignIfNotPresent(options, {
      containerId: "related-posts",
      itemClass: "related-post",
      thumbnailClass: "related-post-thumbnail",
      titleClass: "related-post-title",
      categoryInCommon: "category in common",
      categoriesInCommon: "categories in common",
      maxRelatedItems: 8,
      afterFetch<Ty>(content: Ty[]) {
        if(!document || !this.containerId || content.isEmpty())
          return;

        const container = document.getElementById(this.containerId);
        if(!container)
          return;
        content.forEach(post => {
          const item = (post as RelatedPost).build(this);
          if(item)
            container.appendChild(item);
        })
      }
    })
  }

  build(options: RelatedPostOptions): Nullable<HTMLElement> {
    if(!document)
      return undefined;

    const container = document.createElement("div");
    container.classList.add(options.itemClass);

    container.innerHTML = `
    <div class="${options.thumbnailClass}">
      <a href="${this.post.url}" target="_blank" title="${this._categoriesInCommon(options)}">
        <img src="${this.post.getThumbnail()}" alt="${this.post.title}" />
        <h2 class="${options.titleClass}">${this.post.title}</h2>
      </a>
    </div>
    `
    return container;
  }

  static fetchCurrent(options?: RelatedPostOptions) {
    if(!location)
      return;

    if(Blogger.typeOf(location.href) !== "item")
      return;

    const current = BlogPost.fromCurrentPage();
    const config = Object.orDefault(options, {} as RelatedPostOptions);
    RelatedPost.assignDefaultOptions(config);
    const param = BloggerQueryParamsBuilder.labelSearch(current.labels)
    Blogger.fetchFeed({
      fetch: {
        params: param ? [param] : []
      }
    } as BloggerOptions)
      .then(blog => {
        const related = blog.entries.map(it => new RelatedPost(it, current))
          .sort((a, b) => {
            if(a.count >= b.count)
              return -1;
            return 1;
          })
          .slice(0, config.maxRelatedItems);

        config.afterFetch(related);
      })
      .catch(e => console.log(`Error in fetch current related posts: ${e}`));
  }
}