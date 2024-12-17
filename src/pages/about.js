import Link from 'next/link'; // This is optional since there's no use of `Link` here.
import Layout from "../components/Layout";

export default function About() {
  return (
    <Layout>
      <h2>About Us</h2>
      <p>This is the About page. You can include details about your project here.</p>
    </Layout>
  );
}
