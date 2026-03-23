import profileImage from '../assets/profile.jpeg';

function Specs() {
  return (
    <div className="specs-container center_text">
      <h2>サイトの仕様</h2>
      <p>管理人の空門チエです。ふと昔のサイトを再現してみたくて作ってみました。</p>
      
      <table className="profile-main-table" style={{ margin: '0 auto', borderCollapse: 'separate', borderSpacing: '10px' }}>
        <tbody>
          <tr>
            <td colSpan="2" className="center_text" style={{ paddingBottom: '20px' }}>
              <strong>プロジェクト詳細</strong>
            </td>
          </tr>
          <tr>
            <td style={{ verticalAlign: 'top' }}>
              <img src={profileImage} alt="プロフィール画像" className="profile_image" style={{ maxWidth: '200px', border: '2px solid #00FF00' }} />
            </td>
            <td>
              <table className="profile_box" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
                <tbody>
                  <tr>
                    <th style={{ border: '1px solid #00FF00', padding: '8px', background: '#002200' }}>使用技術</th>
                    <td style={{ border: '1px solid #00FF00', padding: '8px' }}>React, Vite, Docker, Node.js, Express, SQLite, Vanilla CSS, localStorage</td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #00FF00', padding: '8px', background: '#002200' }}>github</th>
                    <td style={{ border: '1px solid #00FF00', padding: '8px' }}>
                      <a href="https://github.com/satonaka-chie9/retro-site-react" target="_blank" rel="noopener noreferrer" style={{ color: '#00FF00' }}>
                        https://github.com/satonaka-chie9/retro-site-react
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #00FF00', padding: '8px', background: '#002200' }}>コンセプト</th>
                    <td style={{ border: '1px solid #00FF00', padding: '8px' }}>
                      フロントエンドはレトロを意識しバックエンドはモダンを意識しセキュリティの向上を狙いました
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Specs;
