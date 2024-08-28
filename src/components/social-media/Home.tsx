"use client";

import { useState, useEffect } from "react";
import { getDocuments } from "../../lib/firebaseUtils";
import Image from "next/image";

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  username: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const postsData = await getDocuments("posts");
      setPosts(postsData.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post)));
    };
    fetchPosts();
  }, []);

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="border rounded-lg overflow-hidden">
          <Image
            src={post.imageUrl}
            alt={post.caption}
            width={500}
            height={500}
            className="w-full"
          />
          <div className="p-4">
            <p className="font-bold">{post.username}</p>
            <p>{post.caption}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
