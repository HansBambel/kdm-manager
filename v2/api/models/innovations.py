#!/usr/bin/python2.7


from assets import innovations, abilities_and_impairments
import Models
import utils


class Assets(Models.AssetCollection):

    def __init__(self, *args, **kwargs):

        self.assets = innovations.innovations
        for a in self.assets.keys():
            if "principle" in self.assets[a].keys():
                self.assets[a]["type"] = "principle"
            else:
                self.assets[a]["type"] = "innovation"

        for m in abilities_and_impairments.weapon_masteries.keys():
            wm = abilities_and_impairments.weapon_masteries[m]
            wm["handle"] = m
            wm["type"] = "weapon_mastery"
            self.assets[m] = wm

        Models.AssetCollection.__init__(self,  *args, **kwargs)


    def get_principles(self):
        """ Spits out the principles dict from assets/principles.py. """
        return innovations.principles

    def get_principle(self, p_handle):
        """ Returns a single principle asset dictionary. """
        return innovations.principles[p_handle]


    def get_principle_from_name(self, p_name):
        """ Use a name to get a principle asset (dict) back. This is basically
        a legacy support method for retrieving principles based on a name b/c
        settlements are still using names instead of handles for principles."""

        lookup_dict = {}
        for i_handle in self.assets.keys():
            if "principle" in self.get_asset(i_handle).keys():
                p_dict = self.get_asset(i_handle)
                lookup_dict[p_dict["name"]] = p_dict

        return lookup_dict[p_name]


    def get_mutually_exclusive_principles(self):
        """ Returns a dictionary object listing game asset names for the
        mutually exclusive principle pairs. """

        output = {}
        principles = self.get_principles()
        for p in principles.keys():
            p_dict = principles[p]
            alternatives = set()
            for option in p_dict["option_handles"]:
                alternatives.add(self.get_asset(option)["name"])
            output[p_dict["name"]] = tuple(alternatives)
        return output



class Innovation(Models.GameAsset):
    """ This is the base class for all innovations."""

    def __init__(self, *args, **kwargs):
        Models.GameAsset.__init__(self,  *args, **kwargs)

        self.assets = Assets()
        self.initialize()

