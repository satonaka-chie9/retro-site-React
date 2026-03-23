import profileImage from '../assets/profile.jpeg';

function Profile() {
  return (
    <div className="profile-container center_text">
      <h2>Profile</h2>
      <p>管理人の空門チエです。ふと昔のサイトを再現してみたくて作ってみました。</p>

      <table className="profile-main-table" style={{ margin: '0 auto', borderCollapse: 'separate', borderSpacing: '10px' }}>
        <tbody>
          <tr>
            <td colSpan="2" className="center_text" style={{ paddingBottom: '20px' }}>
              <strong>プロフィール</strong>
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
                    <th style={{ border: '1px solid #00FF00', padding: '8px', background: '#002200' }}>名前</th>
                    <td style={{ border: '1px solid #00FF00', padding: '8px' }}>空門チエ</td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #00FF00', padding: '8px', background: '#002200' }}>趣味</th>
                    <td style={{ border: '1px solid #00FF00', padding: '8px' }}>ゲーム、アニメ鑑賞、PCいじり、旅</td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #00FF00', padding: '8px', background: '#002200' }}>好きなもの</th>
                    <td style={{ border: '1px solid #00FF00', padding: '8px' }}>80年代の文化、アニメ、自然</td>
                  </tr>
                  <tr>
                    <th style={{ border: '1px solid #00FF00', padding: '8px', background: '#002200' }}>一言</th>
                    <td style={{ border: '1px solid #00FF00', padding: '8px' }}>このサイトを楽しんでいただけると嬉しいです！</td>
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

export default Profile;
