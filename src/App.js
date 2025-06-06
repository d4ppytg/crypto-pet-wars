// src/App.js - ПОЛНАЯ И ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sword, Shield, Heart, Zap, Coins, Star, Trophy,
  Gift, Settings, User, Home, Plus, Crown, Sparkles,
  Flame, Snowflake, Leaf
} from 'lucide-react';
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { playClick, playWin, playLose } from './sounds';

// Utility functions
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const formatTON = (amount) => `${(amount / 1_000_000_000).toFixed(2)} TON`;

// Pet data
const PET_RARITIES = {
  common: { color: 'from-gray-400 to-gray-600', chance: 60, multiplier: 1 },
  rare: { color: 'from-blue-400 to-blue-600', chance: 25, multiplier: 1.5 },
  epic: { color: 'from-purple-400 to-purple-600', chance: 10, multiplier: 2 },
  legendary: { color: 'from-yellow-400 to-yellow-600', chance: 5, multiplier: 3 }
};

const ELEMENTS = {
  fire: { icon: Flame, color: 'text-red-500', weakness: 'water', strength: 'nature' },
  water: { icon: Snowflake, color: 'text-blue-500', weakness: 'lightning', strength: 'fire' },
  lightning: { icon: Zap, color: 'text-yellow-500', weakness: 'nature', strength: 'water' },
  nature: { icon: Leaf, color: 'text-green-500', weakness: 'fire', strength: 'lightning' }
};

const PETS_DATA = [
    { id: 1, name: 'Fire Dragon', element: 'fire', baseStats: { hp: 120, attack: 85, defense: 65, speed: 70 } },
    { id: 2, name: 'Water Serpent', element: 'water', baseStats: { hp: 110, attack: 75, defense: 80, speed: 75 } },
    { id: 3, name: 'Thunder Wolf', element: 'lightning', baseStats: { hp: 100, attack: 90, defense: 60, speed: 90 } },
    { id: 4, name: 'Earth Bear', element: 'nature', baseStats: { hp: 140, attack: 70, defense: 90, speed: 50 } },
];

const ENEMIES = [
    { id: 1, name: 'Goblin Warrior', element: 'nature', hp: 80, attack: 45, defense: 30, speed: 60, reward: 15 },
    { id: 2, name: 'Fire Imp', element: 'fire', hp: 70, attack: 55, defense: 25, speed: 70, reward: 20 },
    { id: 3, name: 'Ice Golem', element: 'water', hp: 120, attack: 40, defense: 60, speed: 30, reward: 25 },
    { id: 4, name: 'Storm Eagle', element: 'lightning', hp: 90, attack: 65, defense: 35, speed: 85, reward: 30 },
];

const App = () => {
  // Core game state
  const [screen, setScreen] = useState('home');
  const [coins, setCoins] = useState(100);
  const [tonBalance, setTonBalance] = useState('0');
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpToNext, setXpToNext] = useState(100);

  // Pet and inventory state
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);

  // Battle state
  const [battleState, setBattleState] = useState(null);
  const [battleLog, setBattleLog] = useState([]);

  // UI state
  const [notifications, setNotifications] = useState([]);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // TON Wallet hooks
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  // Utility and game logic functions
  const showNotification = (message, type = 'info') => {
      const id = Date.now();
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };
  
  const fetchLeaderboard = useCallback(async () => {
      setIsLoadingLeaderboard(true);
      try {
          const response = await fetch('/api/leaderboard');
          const data = await response.json();
          if (response.ok) {
              setLeaderboardData(data);
          } else {
              showNotification(data.error || 'Failed to load leaderboard', 'error');
          }
      } catch (error) {
          console.error("Failed to fetch leaderboard:", error);
          showNotification('Network error loading leaderboard', 'error');
      } finally {
          setIsLoadingLeaderboard(false);
      }
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
      if (screen === 'leaderboard') {
          fetchLeaderboard();
      }
  }, [screen, fetchLeaderboard]);

  const createPet = (petData, rarity, level) => {
    const rarityMultiplier = PET_RARITIES[rarity].multiplier;
    return {
      ...petData,
      uniqueId: Date.now() + Math.random(),
      rarity, level,
      currentHp: Math.floor(petData.baseStats.hp * rarityMultiplier),
      maxHp: Math.floor(petData.baseStats.hp * rarityMultiplier),
      attack: Math.floor(petData.baseStats.attack * rarityMultiplier),
      defense: Math.floor(petData.baseStats.defense * rarityMultiplier),
      speed: Math.floor(petData.baseStats.speed * rarityMultiplier),
      xp: 0, xpToNext: level * 50
    };
  };

  useEffect(() => {
    if (pets.length === 0) {
      const starterPet = createPet(PETS_DATA[0], 'common', 1);
      setPets([starterPet]);
      setSelectedPet(starterPet);
    }
  }, []);

  const gainXP = (amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      if (newXp >= xpToNext) {
        setLevel(l => l + 1);
        setXpToNext(xtn => Math.floor(xtn * 1.5));
        showNotification(`Level up! You are now level ${level + 1}!`, 'success');
        return newXp - xpToNext;
      }
      return newXp;
    });
  };

  const performAttack = (attacker, defender) => {
    const elementAdvantage = ELEMENTS[attacker.element]?.strength === defender.element ? 1.5 : 
                            ELEMENTS[attacker.element]?.weakness === defender.element ? 0.7 : 1;
    const damage = Math.max(1, Math.floor((attacker.attack * elementAdvantage - defender.defense * 0.5) * (0.8 + Math.random() * 0.4)));
    const newHp = Math.max(0, defender.currentHp - damage);
    setBattleLog(prev => [...prev, `${attacker.name} attacks for ${damage} damage! ${elementAdvantage > 1 ? 'Super effective!' : elementAdvantage < 1 ? 'Not very effective...' : ''}`]);
    return { ...defender, currentHp: newHp };
  };

  const battleTurn = () => {
    if (!battleState || battleState.battlePhase !== 'active') return;

    let newBattleState = { ...battleState };

    if (battleState.turn === 'player') {
      newBattleState.enemy = performAttack(battleState.playerPet, battleState.enemy);
      if (newBattleState.enemy.currentHp <= 0) {
        const rewards = battleState.enemy.reward;
        setCoins(prev => prev + rewards);
        gainXP(20);
        setBattleLog(prev => [...prev, `Victory! Earned ${rewards} coins and 20 XP!`]);
        playWin();

        const reportWin = async () => {
          if (window.Telegram?.WebApp?.initData) {
            try {
              await fetch('/api/report-win', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: window.Telegram.WebApp.initData }),
              });
              console.log("Win reported to server!");
              showNotification("Your victory has been recorded!", 'success');
            } catch (error) {
              console.error("Failed to report win:", error);
              showNotification("Could not record victory", 'error');
            }
          } else {
             console.log("Not in Telegram, win not reported.");
          }
        };
        reportWin();
        
        newBattleState.battlePhase = 'victory';
        setTimeout(() => {
          setScreen('adventure');
          setBattleState(null);
        }, 2000);
      } else {
        newBattleState.turn = 'enemy';
        setTimeout(battleTurn, 1000);
      }
    } else { // Enemy's turn
      newBattleState.playerPet = performAttack(battleState.enemy, battleState.playerPet);
      if (newBattleState.playerPet.currentHp <= 0) {
        setBattleLog(prev => [...prev, 'Defeat! Your pet needs rest.']);
        playLose();
        newBattleState.battlePhase = 'defeat';
        setTimeout(() => {
          setScreen('home');
          setBattleState(null);
          setPets(prev => prev.map(p => p.uniqueId === selectedPet.uniqueId ? { ...p, currentHp: p.maxHp } : p));
        }, 2000);
      } else {
        newBattleState.turn = 'player';
      }
    }
    setBattleState(newBattleState);
  };

  const startBattle = (enemy) => {
    playClick();
    if (!selectedPet) {
      showNotification('Select a pet first!', 'error');
      return;
    }
    setBattleState({
      playerPet: { ...selectedPet },
      enemy: { ...enemy, currentHp: enemy.hp, maxHp: enemy.hp },
      turn: selectedPet.speed >= enemy.speed ? 'player' : 'enemy',
      battlePhase: 'active'
    });
    setBattleLog([`Battle started! ${selectedPet.name} vs ${enemy.name}`]);
    setScreen('battle');
  };

  // --- JSX Components ---

  const NotificationSystem = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(n => <div key={n.id} className={`px-4 py-2 rounded-lg shadow-lg text-white ${n.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{n.message}</div>)}
    </div>
  );

  const TopBar = () => (
      <div className="bg-gradient-to-r from-purple-900/80 to-blue-900/80 p-4 border-b border-purple-500/30">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-yellow-500/20 px-3 py-1 rounded-full">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-bold">{coins}</span>
              </div>
              <div className="flex items-center space-x-2 bg-purple-500/20 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 font-bold">Lv.{level}</span>
              </div>
            </div>
            <TonConnectButton />
        </div>
        <div className="mt-2">
            <div className="bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full" style={{ width: `${(xp / xpToNext) * 100}%` }}></div>
            </div>
            <div className="text-xs text-gray-400 mt-1">{xp}/{xpToNext} XP to next level</div>
        </div>
      </div>
  );

  const PetCard = ({ pet, onClick, isSelected = false }) => {
    const ElementIcon = ELEMENTS[pet.element]?.icon || Zap;
    const rarityGradient = PET_RARITIES[pet.rarity]?.color || 'from-gray-400 to-gray-600';
    return (
      <div onClick={() => onClick && onClick(pet)} className={`relative p-4 rounded-xl cursor-pointer ${isSelected ? 'ring-2 ring-yellow-400' : ''}`}>
        <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold bg-gradient-to-r ${rarityGradient} text-white rounded-full`}>{pet.rarity.toUpperCase()}</div>
        <div className="flex items-center space-x-3 mb-3">
          <div className={`p-2 rounded-full bg-gradient-to-r ${rarityGradient}`}><ElementIcon className={`w-6 h-6 ${ELEMENTS[pet.element]?.color}`} /></div>
          <div><h3 className="text-white font-bold">{pet.name}</h3><p className="text-gray-400 text-sm">Level {pet.level}</p></div>
        </div>
        <div className="flex justify-between items-center text-red-400 font-bold"><span>HP</span><span>{pet.currentHp}/{pet.maxHp}</span></div>
        <div className="bg-red-900/30 rounded-full h-2 mt-1"><div className="bg-red-500 h-2 rounded-full" style={{ width: `${(pet.currentHp / pet.maxHp) * 100}%` }}></div></div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-center"><div className="text-orange-400 font-bold">{pet.attack}<div className="text-gray-500">ATK</div></div><div className="text-blue-400 font-bold">{pet.defense}<div className="text-gray-500">DEF</div></div><div className="text-green-400 font-bold">{pet.speed}<div className="text-gray-500">SPD</div></div></div>
      </div>
    );
  };
  
  const EnemyCard = ({ enemy, onBattle }) => (
    <div className="p-4 rounded-xl bg-red-900/40 border border-red-600/30">
        <div className="flex items-center space-x-3 mb-3">
            <div><h3 className="text-white font-bold">{enemy.name}</h3><p className="text-gray-400 text-sm">Reward: {enemy.reward} coins</p></div>
        </div>
        <button onClick={() => onBattle(enemy)} className="w-full py-2 bg-red-600 text-white rounded-lg font-bold"><Sword className="w-4 h-4 inline mr-2" />BATTLE</button>
    </div>
  );

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-lg border-t border-white/20">
      <div className="flex justify-around items-center h-16">
        <button onClick={() => { playClick(); setScreen('home'); }} className={`p-2 rounded-lg ${screen === 'home' ? 'bg-white/20' : ''}`}><Home className="w-6 h-6 text-white" /></button>
        <button onClick={() => { playClick(); setScreen('pets'); }} className={`p-2 rounded-lg ${screen === 'pets' ? 'bg-white/20' : ''}`}><User className="w-6 h-6 text-white" /></button>
        <button onClick={() => { playClick(); setScreen('adventure'); }} className={`p-2 rounded-lg ${screen === 'adventure' ? 'bg-white/20' : ''}`}><Sword className="w-6 h-6 text-white" /></button>
        <button onClick={() => { playClick(); setScreen('leaderboard'); }} className={`p-2 rounded-lg ${screen === 'leaderboard' ? 'bg-white/20' : ''}`}><Trophy className="w-6 h-6 text-white" /></button>
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="space-y-6">
        <div className="text-center"><h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">Crypto Pet Wars</h1><p className="text-gray-400">Train, Battle, Conquer</p></div>
        {selectedPet && <div><h2 className="text-xl font-bold text-white mb-3">Your Active Pet</h2><PetCard pet={selectedPet} /></div>}
    </div>
  );

  const PetsScreen = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white">My Pets</h1><button onClick={() => { playClick(); setScreen('shop'); }} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold"><Plus className="w-4 h-4 inline mr-2" />Get More</button></div>
      <div className="grid gap-4">{pets.map(pet => (<PetCard key={pet.uniqueId} pet={pet} onClick={setSelectedPet} isSelected={selectedPet?.uniqueId === pet.uniqueId} />))}</div>
    </div>
  );

  const ShopScreen = () => (
    <div className="space-y-6"><h1 className="text-2xl font-bold text-white">Pet Shop</h1></div>
  );

  const AdventureScreen = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Adventure</h1>
      {!selectedPet && (<div className="p-4 bg-red-900/40 border border-red-600/30 rounded-xl"><p className="text-red-400">Select a pet first!</p></div>)}
      <div className="grid gap-4">{ENEMIES.map(enemy => (<EnemyCard key={enemy.id} enemy={enemy} onBattle={startBattle} />))}</div>
    </div>
  );
  
  const BattleScreen = () => {
    if (!battleState) return null;
    const { playerPet, enemy, turn, battlePhase } = battleState;
    return (
      <div className="space-y-6">
        <div className="text-center"><h1 className="text-2xl font-bold">Battle Arena</h1><p>{battlePhase === 'active' ? `${turn === 'player' ? 'Your' : 'Enemy'} Turn` : battlePhase === 'victory' ? 'Victory!' : 'Defeat!'}</p></div>
        <div className="grid grid-cols-2 gap-4">
          <div><h3>{playerPet.name}</h3><p>{playerPet.currentHp}/{playerPet.maxHp} HP</p></div>
          <div><h3>{enemy.name}</h3><p>{enemy.currentHp}/{enemy.maxHp} HP</p></div>
        </div>
        <div className="h-24 overflow-y-auto bg-black/20 p-2">{battleLog.map((log, i) => <p key={i}>{log}</p>)}</div>
        {battlePhase === 'active' && turn === 'player' && <button onClick={battleTurn} className="w-full py-3 bg-red-600 font-bold">ATTACK</button>}
      </div>
    );
  };
  
  const LeaderboardScreen = () => (
    <div className="space-y-4">
      <div className="text-center mb-6"><Trophy className="w-12 h-12 mx-auto text-yellow-400 mb-2" /><h1 className="text-3xl font-bold text-white">Top Players</h1></div>
      {isLoadingLeaderboard ? (<p className="text-center animate-pulse">Loading...</p>) : leaderboardData.length === 0 ? (<p className="text-center text-gray-400">Be the first to win!</p>) : (
        <div className="space-y-3">
          {leaderboardData.map((player) => (
            <div key={player.rank} className="flex items-center p-3 bg-white/10 rounded-lg"><div className="text-xl font-bold text-yellow-300 w-10 text-center">{player.rank}</div><div className="flex-grow font-bold text-white">{player.name}</div><div className="text-lg text-green-400">{player.score.toLocaleString()} wins</div></div>
          ))}
        </div>
      )}
    </div>
  );

  const renderScreen = () => {
    switch (screen) {
      case 'home': return <HomeScreen />;
      case 'pets': return <PetsScreen />;
      case 'shop': return <ShopScreen />;
      case 'adventure': return <AdventureScreen />;
      case 'battle': return <BattleScreen />;
      case 'leaderboard': return <LeaderboardScreen />;
      default: return <HomeScreen />;
    }
  };
  
  return (
    <div className="bg-gradient-to-b from-purple-900 via-gray-900 to-blue-900 min-h-screen text-white p-4 font-sans pb-20">
      <NotificationSystem />
      <TopBar />
      <main className="mt-6">
        {renderScreen()}
      </main>
      <BottomNav />
    </div>
  );
};

export default App;