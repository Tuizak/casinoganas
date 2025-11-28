import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../context/AuthContext";

// Auth
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";

// Pantallas principales
import HomeScreen from "../screens/Home/HomeScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import AllGamesScreen from "../screens/Home/AllGamesScreen";

// Juegos 1–11
import SlotMachine from "../games/game1/SlotMachine";
import ResultScreen from "../games/game1/ResultScreen";
import CosmicRoulette from "../games/game2/CosmicRoulette";
import BattleOfElements from "../games/game3/BattleOfElements";
import CosmicSpin from "../games/game5/CosmicSpin";
import NeonFruits from "../games/game6/NeonFruits";
import MysticGems from "../games/game7/MysticGems";
import MegaSevens from "../games/game8/MegaSevens";
import ZeusPowerSlots from "../games/game9/ZeusGameScreen";
import PlinkoCosmic from "../games/game10/PlinkoCosmic";
import BigWinScreen from "../games/game9/BigWinScreen";
import GhostLineGame from "../games/game11/GhostLineGame";

// Juegos 12–20
import LuckyCards from "../games/game12/LuckyCards";
import DiceRush from "../games/game13/DiceRush";
import CoinToss from "../games/game14/CoinToss";
import CardFlipCasino from "../games/game15/CardFlipCasino";
import SlotRoyale3D from "../games/game16/SlotRoyale3D";
import BlackjackRush from "../games/game17/BlackjackRush";
import LuckyWheelGame from "../games/game18/LuckyWheel";
import DiceDuelGame from "../games/game19/DiceDuel";
import CrashX from "../games/game20/CrashX";

// Juegos 21–26
import BlackjackGame from "../games/game21/BlackjackGame";
import CasinoWarScreen from "../games/game22/CasinoWarScreen";
import RedDogScreen from "../games/game23/RedDogScreen";
import ThreeCardPokerScreen from "../games/game24/ThreeCardPokerScreen";
import DragonTigerScreen from "../games/game25/DragonTigerScreen";
import DragonGemsScreen from "../games/game26/DragonGemsScreen";

// Juegos 27-29
import DiceGame from "../games/game27/Twodice";
import ScratchandWin from "../games/game28/ScratchandWin";
import Roulette from "../games/game29/Roulette";

// Créditos
import BuyCreditsScreen from "../screens/Credits/BuyCreditsScreen";
import SendCredit from "../screens/SendCredit/SendCredit";

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {/* Main */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="AllGames" component={AllGamesScreen} />

            {/* Juegos 1–11 */}
            <Stack.Screen name="SlotMachine" component={SlotMachine} />
            <Stack.Screen name="ResultScreen" component={ResultScreen} />
            <Stack.Screen name="CosmicRoulette" component={CosmicRoulette} />
            <Stack.Screen name="BattleOfElements" component={BattleOfElements} />
            <Stack.Screen name="CosmicSpin" component={CosmicSpin} />
            <Stack.Screen name="MysticGems" component={MysticGems} />
            <Stack.Screen name="NeonFruits" component={NeonFruits} />
            <Stack.Screen name="MegaSevens" component={MegaSevens} />
            <Stack.Screen name="ZeusPowerSlots" component={ZeusPowerSlots} />
            <Stack.Screen name="PlinkoCosmic" component={PlinkoCosmic} />
            <Stack.Screen name="BigWin" component={BigWinScreen} />
            <Stack.Screen name="GhostLineGame" component={GhostLineGame} />

            {/* Créditos */}
            <Stack.Screen name="BuyCredits" component={BuyCreditsScreen} />
            <Stack.Screen name="SenCredit" component={SendCredit} />


            {/* Juegos 12–20 */}
            <Stack.Screen name="LuckyCards" component={LuckyCards} />
            <Stack.Screen name="SpinOfFate" component={DiceRush} />
            <Stack.Screen name="TreasureFlip" component={CoinToss} />
            <Stack.Screen name="DiceDuel" component={DiceDuelGame} />
            <Stack.Screen name="LuckyWheel" component={LuckyWheelGame} />
            <Stack.Screen name="MinefieldRush" component={BlackjackRush} />
            <Stack.Screen name="CardMatch" component={CardFlipCasino} />
            <Stack.Screen name="TowerOfChance" component={SlotRoyale3D} />
            <Stack.Screen name="CrashX" component={CrashX} />

            {/* Juegos 21–26 */}
            <Stack.Screen name="Blackjack" component={BlackjackGame} />
            <Stack.Screen name="CasinoWar" component={CasinoWarScreen} />
            <Stack.Screen name="RedDog" component={RedDogScreen} />
            <Stack.Screen name="DragonTiger" component={DragonTigerScreen} />
            <Stack.Screen name="ThreeCardPoker" component={ThreeCardPokerScreen} />
            <Stack.Screen name="DragonGems" component={DragonGemsScreen} />

             {/* Juegos 27–29 */}
            <Stack.Screen name="DiceGame" component={DiceGame} />
            <Stack.Screen name="ScratchandWin" component={ScratchandWin} />
            <Stack.Screen name="Roulette" component={Roulette} />

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
