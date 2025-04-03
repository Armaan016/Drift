import { useState } from "react";

interface CommentInputProps {
    onSubmit: (content: string, imageUrl?: string, voiceUrl?: string) => Promise<void>;
}

export default function CommentInput({ onSubmit }: CommentInputProps) {
    const [comment, setComment] = useState("");
    const [imageUrl, setImageUrl] = useState<string | undefined>();
    const [voiceUrl, setVoiceUrl] = useState<string | undefined>();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!comment.trim() && !imageUrl && !voiceUrl) return;
        onSubmit(comment, imageUrl, voiceUrl);
        setComment("");
        setImageUrl(undefined);
        setVoiceUrl(undefined);
    }

    return (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-2 rounded-lg bg-gray-700 text-white resize-none"
            />

            {/* Image Upload */}
            {/* <input type="file" accept="image/*" onChange={(e) => {
                if (e.target.files?.[0]) setImageUrl(URL.createObjectURL(e.target.files[0]));
            }} /> */}

            {/* Voice Upload (Placeholder) */}
            {/* <button type="button" onClick={() => setVoiceUrl("fake-voice-url.mp3")} className="text-sm text-blue-500">
                Add Voice Note
            </button> */}

            <button type="submit" className="mt-2 bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded-lg">
                Post Comment
            </button>
        </form>
    );
}
