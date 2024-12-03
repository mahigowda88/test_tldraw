import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [nodes, setNodes] = useState([]); // Store the node data

  const tldrawAppRef = React.useRef(null); // Ref for Tldraw app instance

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResult('Please enter a search query.');
      return;
    }
  
    setLoading(true);
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `Provide detailed information and a summary about: ${searchQuery}. Include key points and examples if applicable.`,
            },
          ],
          max_tokens: 4000, 
          temperature: 0.5, 
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          },
        }
      );
  
      console.log('Response:', response.data);
  
      if (
        response.data &&
        response.data.choices &&
        response.data.choices.length > 0 &&
        response.data.choices[0].message
      ) {
        setSearchResult(response.data.choices[0].message.content.trim());
      } else {
        setSearchResult('No results found.');
      }
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
      setSearchResult(
        error.response?.data?.error?.message || 'Error fetching results. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTextSelect = (e) => {
    const selected = window.getSelection().toString();
    setSelectedText(selected);
  };

  const handleInsert = () => {
    if (!selectedText) {
      alert('No text selected.');
      return;
    }

    const newNode = {
      id: `shape:node-${nodes.length + 1}`,
      text: selectedText,
      x: 20, 
      y: 100 + nodes.length * 150, 
    };

    const lastNode = nodes.length > 0 ? nodes[nodes.length - 1] : null;

    setNodes((prevNodes) => [...prevNodes, newNode]);

    if (tldrawAppRef.current) {
      tldrawAppRef.current.createShapes([
        {
          id: newNode.id,
          type: 'geo',
          x: newNode.x,
          y: newNode.y,
          props: {
            w:600,
            geo: 'rectangle',
            text: newNode.text,
          },
        },
      ]);

      if (lastNode) {
        const startX = lastNode.x + 50; // Center of the previous rectangle
        const startY = lastNode.y + 100; // Bottom of the previous rectangle
        const endX = newNode.x + 50; // Center of the new rectangle
        const endY = newNode.y; // Top of the new rectangle

        tldrawAppRef.current.createShapes([
          {
            id: `shape:arrow-${lastNode.id}-${newNode.id}`,
            type: 'arrow',
            props: {
              start: { x: startX, y: startY },
              end: { x: endX, y: endY },
            },
          },
        ]);
      }
    }

    setSelectedText(''); // Clear the selected text
  };

  const handleTldrawMount = (app) => {
    tldrawAppRef.current = app; 
  };

  return (
    <div className="container">
      <div className="compartment left">
      <div className="insert-area">
          <button onClick={handleInsert}>Insert</button>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="search-result" onMouseUp={handleTextSelect}>
          <h3>Search Result:</h3>
          <p>{searchResult || 'No results yet.'}</p>
        </div>        
      </div>
      <div className="compartment right">
        <Tldraw onMount={handleTldrawMount} />
      </div>
    </div>
  );
}
export default App;
