import importlib.util
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('opponents',Path(__file__).with_name('23_build_opponent_context.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class OpponentsTest(unittest.TestCase):
    def test_strong_opposition_improves_equal_base_and_converges(self):
        base={'a':50,'b':50,'strong':90,'weak':10}
        edges={'a':{'strong':1},'b':{'weak':1},'strong':{'a':1},'weak':{'b':1}}
        result,iterations,error=module.propagate(base,edges)
        self.assertGreater(result['a'],result['b'])
        self.assertLess(error,1e-8)
        self.assertLess(iterations,60)
        self.assertTrue(all(0<=v<=100 for v in result.values()))
        inverse,_,_=module.propagate(dict(reversed(list(base.items()))),edges)
        self.assertEqual(result,inverse)

    def test_ties_and_missing_are_not_zero(self):
        self.assertEqual(module.percentile([10,10,20],10),100/3)
        self.assertIsNone(module.percentile([],0))
        self.assertIsNone(module.percentile([1],None))

    def test_play_in_and_cup_final_do_not_become_regular_season(self):
        game={'date':'2024-04-16','home':'NBA:NOP','away':'NBA:LAL','phase':'rs'}
        self.assertFalse(module.eligible_game(game,2024))
        self.assertTrue(module.eligible_game({**game,'date':'2024-04-14'},2024))
        self.assertFalse(module.eligible_game({**game,'date':'2023-12-09','home':'NBA:IND'},2024))
        self.assertTrue(module.eligible_game({**game,'date':'2023-12-07','home':'NBA:IND'},2024))


if __name__=='__main__':unittest.main()
