import React from "react";
import WritingResult from "../../components/WritingResult";
import { useAuth } from "../../context/AuthContext";
import "./wResault.css";

function WResultPage() {
    const { user } = useAuth();

    return (
        <WritingResult
            user={user}
            readingBand={null}
            listeningBand={null}
            speakingBand={null}
        />
    );
}

export default WResultPage;
