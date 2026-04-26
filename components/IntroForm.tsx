import React, { useState } from 'react';

export const IntroForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({ name: '', age: '', appearance: '', magicSystem: '' });

  return (
    <div style={{
      margin: '1rem 0', padding: '1.5rem', border: '1px solid rgba(16,185,129,0.5)',
      borderRadius: '1rem', background: 'linear-gradient(180deg, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 100%)',
      boxShadow: '0 0 20px rgba(16,185,129,0.1)'
    }}>
      <h3 style={{ color: '#10b981', marginTop: 0, fontFamily: "'Space Grotesk',sans-serif", textTransform: 'uppercase', fontWeight: 800, textAlign: 'center', letterSpacing: '0.1em' }}>
        Đăng Ký Thực Thể
      </h3>
      <p style={{ color: '#a1a1aa', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' }}>
        Hệ thống đang chờ bạn khởi tạo nhân dạng...
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input 
          type="text" 
          placeholder="Tên của bạn" 
          value={formData.name} 
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
        />
        <input 
          type="number" 
          placeholder="Tuổi" 
          value={formData.age} 
          onChange={e => setFormData({ ...formData, age: e.target.value })}
          style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
        />
        <input 
          type="text" 
          placeholder="Ngoại hình / Đặc điểm" 
          value={formData.appearance} 
          onChange={e => setFormData({ ...formData, appearance: e.target.value })}
          style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
        />
        <input 
          type="text" 
          placeholder="Pháp hệ (VD: Hỏa, Băng, Lôi...)" 
          value={formData.magicSystem} 
          onChange={e => setFormData({ ...formData, magicSystem: e.target.value })}
          style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
        />
        <button 
          onClick={() => onSubmit(formData)}
          style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#10b981', color: '#000', fontWeight: 'bold', borderRadius: '0.5rem', cursor: 'pointer', border: 'none' }}
        >
          Khởi Tạo
        </button>
      </div>
    </div>
  );
};
