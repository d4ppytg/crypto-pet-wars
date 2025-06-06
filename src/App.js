// src/App.js - ПОЛНАЯ И ИСПРАВЛЕННАЯ ВЕРСИЯ С АНИМАЦИЯМИ

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sword, User, Home, Plus, Trophy,
  Coins, Star, Flame, Snowflake, Leaf, Zap
} from 'lucide-react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { playClick, playWin, playLose } from './sounds';
import { motion, AnimatePresence } from 'framer-motion';

// --- ДАННЫЕ ИГРЫ ---
const PET_RARITIES = {
  common: { color: 'from-gray-400 to-gray-600', multiplier: 1 },
  rare: { color: 'from-blue-400 to-blue-600', multiplier: 1.5 },
  epic: { color: 'from-purple-400 to-purple-600', multiplier: 2 },
  legendary: { color: 'from-yellow-400 to-yellow-600', multiplier: 3 }
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
];

const App = () => {
  const [screen, setScreen] = useState('home');
  const [coins, setCoins] = useState(100);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpToNext, setXpToNext] = useState(100);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const showNotification = (message, type = 'info') => {
      const id = Date.now();
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };
  
  const fetchLeaderboard = useCallback(() => {
    setIsLoadingLeaderboard(true);
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          showNotification(data.error, 'error');
        } else {
          setLeaderboardData(data);
        }
      })
      .catch(() => showNotification('Network error', 'error'))
      .finally(() => setIsLoadingLeaderboard(false));
  }, []);

  useEffect(() => {
    if (screen === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [screen, fetchLeaderboard]);

  const createPet = useCallback((petData, rarity, level) => {
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
    };
  }, []);
  
  useEffect(() => {
    if (pets.length === 0) {
      const starterPet = createPet(PETS_DATA[0], 'common', 1);
      setPets([starterPet]);
      setSelectedPet(starterPet);
    }
  }, [pets.length, createPet]);
  
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
    const elementAdvantage = ELEMENTS[attacker.element]?.strength === defender.element ? 1.5 : ELEMENTS[attacker.element]?.weakness === defender.element ? 0.7 : 1;
    const damage = Math.max(1, Math.floor((attacker.attack * elementAdvantage - defender.defense * 0.5) * (0.8 + Math.random() * 0.4)));
    const newHp = Math.max(0, defender.currentHp - damage);
    setBattleLog(prev => [...prev, `${attacker.name} attacks for ${damage} damage! ${elementAdvantage > 1 ? 'Super effective!' : elementAdvantage < 1 ? 'Not very effective...' : ''}`]);
    return { ...defender, currentHp: newHp };
  };
  
  const battleTurn = () => {
    if (!battleState || battleState.battlePhase !== 'active') return;
    
    setBattleState(currentState => {
        let newBattleState = { ...currentState };
        if (currentState.turn === 'player') {
            newBattleState.enemy = performAttack(currentState.playerPet, currentState.enemy);
            if (newBattleState.enemy.currentHp <= 0) {
                const rewards = currentState.enemy.reward;
                setCoins(prev => prev + rewards);
                gainXP(20);
                setBattleLog(prev => [...prev, `Victory! Earned ${rewards} coins and 20 XP!`]);
                playWin();
                if (window.Telegram?.WebApp?.initData) {
                    fetch('/api/report-win', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: window.Telegram.WebApp.initData }) }).catch(err => console.error("Report win failed:", err));
                }
                newBattleState.battlePhase = 'victory';
                setTimeout(() => { setScreen('adventure'); setBattleState(null); }, 2000);
            } else {
                newBattleState.turn = 'enemy';
                setTimeout(battleTurn, 1000);
            }
        } else {
            newBattleState.playerPet = performAttack(currentState.enemy, currentState.playerPet);
            if (newBattleState.playerPet.currentHp <= 0) {
                setBattleLog(prev => [...prev, 'Defeat! Your pet needs rest.']);
                playLose();
                newBattleState.battlePhase = 'defeat';
                setTimeout(() => {
                    setScreen('home');
                    setBattleState(null);
                    setPets(prevPets => prevPets.map(p => p.uniqueId === selectedPet.uniqueId ? { ...p, currentHp: p.maxHp } : p));
                }, 2000);
            } else {
                newBattleState.turn = 'player';
            }
        }
        return newBattleState;
    });
  };

  const startBattle = (enemy) => {
    playClick();
    if (!selectedPet) {
      showNotification('Select a pet first!', 'error');
      return;
    }
    setBattleState({ playerPet: { ...selectedPet }, enemy: { ...enemy, currentHp: enemy.hp, maxHp: enemy.hp }, turn: selectedPet.speed >= enemy.speed ? 'player' : 'enemy', battlePhase: 'active' });
    setBattleLog([`Battle started! ${selectedPet.name} vs ${enemy.name}`]);
    setScreen('battle');
  };

  // --- JSX Components ---
  const NotificationSystem = () => ( <AnimatePresence> {notifications.map(n => ( <motion.div key={n.id} initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 100, scale: 0.8 }} className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white ${n.type === 'success' ? 'bg-green-500/80' : 'bg-red-500/80'}`}>{n.message}</motion.div> ))} </AnimatePresence> );
  const TopBar = () => ( <div className="p-4 bg-black/20 backdrop-blur-sm border-b border-white/10"> <div className="flex justify-between items-center mb-2"> <div className="flex items-center space-x-4"> <div className="flex items-center space-x-2 bg-yellow-500/20 px-3 py-1 rounded-full"> <Coins className="w-4 h-4 text-yellow-400" /> <span className="text-yellow-400 font-bold">{coins}</span> </div> <div className="flex items-center space-x-2 bg-purple-500/20 px-3 py-1 rounded-full"> <Star className="w-4 h-4 text-purple-400" /> <span className="text-purple-400 font-bold">Lv.{level}</span> </div> </div> <TonConnectButton /> </div> <div className="bg-gray-700 rounded-full h-2"> <motion.div className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full" animate={{width: `${(xp / xpToNext) * 100}%`}} transition={{duration: 0.5}} /> </div> </div> );
  const PetCard = ({ pet, onClick, isSelected = false }) => { const ElementIcon = ELEMENTS[pet.element]?.icon || Zap; const rarityGradient = PET_RARITIES[pet.rarity]?.color || 'from-gray-400 to-gray-600'; return ( <motion.div whileHover={{ scale: 1.02 }} onClick={() => onClick && onClick(pet)} className={`relative p-4 rounded-xl cursor-pointer bg-black/20 ${isSelected ? 'ring-2 ring-yellow-400' : 'border border-transparent'}`}> <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold bg-gradient-to-r ${rarityGradient} text-white rounded-full`}>{pet.rarity.toUpperCase()}</div> <div className="flex items-center space-x-3 mb-3"> <div className={`p-2 rounded-full bg-gradient-to-r ${rarityGradient}`}><ElementIcon className={`w-6 h-6 ${ELEMENTS[pet.element]?.color}`} /></div> <div><h3 className="text-white font-bold">{pet.name}</h3><p className="text-gray-400 text-sm">Level {pet.level}</p></div> </div> <div className="flex justify-between items-center text-red-400 font-bold text-sm"><span>HP</span><span>{pet.currentHp}/{pet.maxHp}</span></div> <div className="bg-red-900/30 rounded-full h-2 mt-1"><motion.div className="bg-red-500 h-2 rounded-full" animate={{width: `${(pet.currentHp / pet.maxHp) * 100}%`}} transition={{duration: 0.5}} /></div> <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-center"><div><div className="text-orange-400 font-bold">{pet.attack}</div><div className="text-gray-500">ATK</div></div><div><div className="text-blue-400 font-bold">{pet.defense}</div><div className="text-gray-500">DEF</div></div><div><div className="text-green-400 font-bold">{pet.speed}</div><div className="text-gray-500">SPD</div></div></div> </motion.div> ); };
  const EnemyCard = ({ enemy, onBattle }) => ( <motion.div variants={{hidden: {opacity: 0, y:20}, visible: {opacity: 1, y: 0}}} className="p-4 rounded-xl bg-red-900/40 border border-red-600/30"> <div className="flex items-center space-x-3 mb-3"> <div><h3 className="text-white font-bold">{enemy.name}</h3><p className="text-gray-400 text-sm">Reward: {enemy.reward} coins</p></div> </div> <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onBattle(enemy)} className="w-full py-2 bg-red-600 text-white rounded-lg font-bold"><Sword className="w-4 h-4 inline mr-2" />BATTLE</motion.button> </motion.div> );
  const BottomNav = () => ( <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-lg border-t border-white/20"> <div className="flex justify-around items-center h-16"> <button onClick={() => { playClick(); setScreen('home'); }} className={`p-2 rounded-lg ${screen === 'home' ? 'bg-white/20' : ''}`}><Home className="w-6 h-6 text-white" /></button> <button onClick={() => { playClick(); setScreen('pets'); }} className={`p-2 rounded-lg ${screen === 'pets' ? 'bg-white/20' : ''}`}><User className="w-6 h-6 text-white" /></button> <button onClick={() => { playClick(); setScreen('adventure'); }} className={`p-2 rounded-lg ${screen === 'adventure' ? 'bg-white/20' : ''}`}><Sword className="w-6 h-6 text-white" /></button> <button onClick={() => { playClick(); setScreen('leaderboard'); }} className={`p-2 rounded-lg ${screen === 'leaderboard' ? 'bg-white/20' : ''}`}><Trophy className="w-6 h-6 text-white" /></button> </div> </div> );

  const HomeScreen = () => ( <div className="space-y-6"> <div className="text-center"><h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">Crypto Pet Wars</h1><p className="text-gray-400">Train, Battle, Conquer</p></div> {selectedPet && <div><h2 className="text-xl font-bold text-white mb-3">Your Active Pet</h2><PetCard pet={selectedPet} /></div>} <div className="grid grid-cols-2 gap-4"> <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} onClick={() => { playClick(); setScreen('pets'); }} className="p-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/30"> <User className="w-8 h-8 text-purple-400 mx-auto mb-2" /><div className="text-white font-bold">My Pets</div> <div className="text-gray-400 text-sm">{pets.length} owned</div> </motion.button> <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} onClick={() => { playClick(); setScreen('adventure'); }} className="p-6 bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-xl border border-red-500/30"> <Sword className="w-8 h-8 text-red-400 mx-auto mb-2" /><div className="text-white font-bold">Adventure</div> <div className="text-gray-400 text-sm">Battle enemies</div> </motion.button> </div> </div> );
  const PetsScreen = () => ( <div className="space-y-6"> <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white">My Pets</h1><button onClick={() => { playClick(); setScreen('shop'); }} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold"><Plus className="w-4 h-4 inline mr-2" />Get More</button></div> <div className="grid gap-4">{pets.map(pet => (<PetCard key={pet.uniqueId} pet={pet} onClick={setSelectedPet} isSelected={selectedPet?.uniqueId === pet.uniqueId} />))}</div> </div> );
  const ShopScreen = () => ( <div className="space-y-6"><h1 className="text-2xl font-bold text-white">Pet Shop</h1></div> );
  const AdventureScreen = () => ( <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="space-y-6"> <h1 className="text-2xl font-bold text-white">Adventure</h1> {!selectedPet && (<div className="p-4 bg-red-900/40 border border-red-600/30 rounded-xl"><p className="text-red-400">Select a pet first!</p></div>)} <motion.div className="grid gap-4">{ENEMIES.map(enemy => (<EnemyCard key={enemy.id} enemy={enemy} onBattle={startBattle} />))}</motion.div> </motion.div> );
  const BattleScreen = () => { if (!battleState) return null; const { playerPet, enemy, turn, battlePhase } = battleState; return ( <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} className="space-y-6"> <div className="text-center"><h1 className="text-2xl font-bold">Battle Arena</h1><p>{battlePhase === 'active' ? `${turn === 'player' ? 'Your' : 'Enemy'} Turn` : battlePhase === 'victory' ? 'Victory!' : 'Defeat!'}</p></div> <div className="grid grid-cols-2 gap-4 items-start"> <div><h3 className="text-blue-400 font-bold mb-2">{playerPet.name}</h3><div className="bg-gray-700 rounded-full h-4"><motion.div className="bg-green-500 h-4 rounded-full" animate={{width: `${(playerPet.currentHp / playerPet.maxHp) * 100}%`}} transition={{duration: 0.5}}/></div><p className="text-sm mt-1">{playerPet.currentHp}/{playerPet.maxHp} HP</p></div> <div><h3 className="text-red-400 font-bold mb-2">{enemy.name}</h3><div className="bg-gray-700 rounded-full h-4"><motion.div className="bg-red-500 h-4 rounded-full" animate={{width: `${(enemy.currentHp / enemy.maxHp) * 100}%`}} transition={{duration: 0.5}}/></div><p className="text-sm mt-1">{enemy.currentHp}/{enemy.maxHp} HP</p></div> </div> <div className="h-24 overflow-y-auto bg-black/20 p-2 rounded-lg">{battleLog.map((log, i) => <p key={i} className="text-sm">{log}</p>)}</div> {battlePhase === 'active' && turn === 'player' && <motion.button whileTap={{scale: 0.95}} onClick={battleTurn} className="w-full py-3 bg-red-600 font-bold rounded-lg">ATTACK</motion.button>} </motion.div> ); };
  const LeaderboardScreen = () => ( <div className="space-y-4"> <div className="text-center mb-6"><Trophy className="w-12 h-12 mx-auto text-yellow-400 mb-2" /><h1 className="text-3xl font-bold text-white">Top Players</h1></div> {isLoadingLeaderboard ? (<p className="text-center animate-pulse">Loading...</p>) : leaderboardData.length === 0 ? (<p className="text-center text-gray-400">Be the first to win!</p>) : ( <div className="space-y-3"> {leaderboardData.map((player) => ( <div key={player.rank} className="flex items-center p-3 bg-white/10 rounded-lg"><div className="text-xl font-bold text-yellow-300 w-10 text-center">{player.rank}</div><div className="flex-grow font-bold text-white">{player.name}</div><div className="text-lg text-green-400">{player.score.toLocaleString()} wins</div></div> ))} </div> )} </div> );

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
        <AnimatePresence mode="wait">
            <motion.div
                key={screen}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
            >
                {renderScreen()}
            </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
};

export default App;