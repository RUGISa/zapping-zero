import { useState } from 'react';

export default function WordChain() {
  const [words, setWords] = useState(['사과']);
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const lastChar = words[words.length - 1].slice(-1);
    if (input[0] === lastChar) {
      setWords([...words, input]);
      setInput('');
    } else {
      alert('끝말이 맞지 않아요!');
    }
  };

  return (
    <div>
      <ul>
        {words.map((word, index) => (
          <li key={index}>{word}</li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="단어 입력"
        />
        <button type="submit">입력</button>
      </form>
    </div>
  );
}
