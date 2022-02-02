import { useEffect } from 'react';

export function UtterancComments(): JSX.Element {
  useEffect(() => {
    const commentsDiv = document.getElementById('utteranc-comments');

    const script = document.createElement('script');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('repo', 'oviniciusoliveira/8books');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'utteranc-commentary');
    script.setAttribute('theme', 'github-dark');
    script.setAttribute('async', 'true');

    commentsDiv.replaceChildren(script);
  }, []);

  return <div id="utteranc-comments" />;
}
