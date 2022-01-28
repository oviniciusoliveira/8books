import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { Document } from '@prismicio/client/types/documents';

import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { useState } from 'react';
import { format } from 'date-fns';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page?: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

function mapResults(results: Document[]): Post[] {
  const posts = results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'd MMM y'
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return posts;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);

  async function getNextPage(): Promise<void> {
    setIsLoadingMorePosts(true);
    try {
      const responseRaw = await fetch(nextPage);
      const responseJson: ApiSearchResponse = await responseRaw.json();
      const results = mapResults(responseJson.results);
      setPosts(prevState => [...prevState, ...results]);
      setNextPage(responseJson.next_page);
    } catch {
      return;
    } finally {
      setIsLoadingMorePosts(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <img src="/images/logo.svg" alt="logo" />
      </header>
      <main>
        {posts.map(post => {
          return (
            <div key={post.uid} className={styles.post}>
              <h2>{post.data.title}</h2>
              <p>{post.data.subtitle}</p>
              <div className={styles.postInfo}>
                <span>
                  <FiCalendar /> {post.first_publication_date}
                </span>
                <span>
                  <FiUser /> {post.data.author}
                </span>
              </div>
            </div>
          );
        })}

        {nextPage && (
          <button
            className={styles.button}
            type="button"
            onClick={() => getNextPage()}
          >
            {isLoadingMorePosts ? 'Carregando...' : 'Carregar mais posts'}
          </button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
    }
  );

  const nextPage = response.next_page;

  const results = mapResults(response.results);

  return {
    props: {
      postsPagination: {
        next_page: nextPage,
        results,
      },
    },
  };
};
